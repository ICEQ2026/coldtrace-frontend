import { Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { AssetManagementStore } from '../../asset-management/application/asset-management.store';
import { AssetSettings } from '../../asset-management/domain/model/asset-settings.entity';
import { Asset } from '../../asset-management/domain/model/asset.entity';
import { ConnectivityStatus } from '../../asset-management/domain/model/connectivity-status.enum';
import { IoTDevice } from '../../asset-management/domain/model/iot-device.entity';
import { SensorReading } from '../../monitoring/domain/model/sensor-reading.entity';
import { MonitoringStore } from '../../monitoring/application/monitoring.store';
import { Report } from '../domain/model/report.entity';
import { ReportType } from '../domain/model/report-type.enum';
import { DailyLog, DailyLogEntry, DailyLogStatus } from '../domain/model/daily-log.entity';
import {
  OperationalHistory,
  OperationalHistoryEvent,
  OperationalHistoryFilters,
  OperationalHistorySeverity,
} from '../domain/model/operational-history.entity';
import { ReportsApi } from '../infrastructure/reports-api';

@Injectable({ providedIn: 'root' })
export class ReportsStore {
  private readonly reportsSignal = signal<Report[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly reports = this.reportsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(
    private readonly reportsApi: ReportsApi,
    private readonly assetManagementStore: AssetManagementStore,
    private readonly monitoringStore: MonitoringStore,
  ) {}

  loadReports(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.reportsApi.getReports().subscribe({
      next: (reports) => {
        this.reportsSignal.set(reports);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.reportsSignal.set([]);
        this.errorSignal.set(null);
        this.loadingSignal.set(false);
      },
    });
  }

  reportsForOrganization(organizationId: number | null): Report[] {
    if (!organizationId) {
      return [];
    }

    return this.reports().filter((report) => report.organizationId === organizationId);
  }

  currentDate(): string {
    return this.today();
  }

  buildDailyLog(organizationId: number | null, date: string): DailyLog {
    const safeOrganizationId = organizationId ?? 0;
    const assets = this.assetManagementStore.assetsForOrganization(organizationId);
    const iotDevices = this.assetManagementStore.iotDevicesForOrganization(organizationId);
    const monitoredAssetIds = new Set(
      iotDevices
        .filter((iotDevice) => iotDevice.assetId !== null)
        .map((iotDevice) => iotDevice.assetId as number),
    );
    const readings = this.monitoringStore
      .readingsForAssetIds(assets.map((asset) => asset.id))
      .filter((reading) => this.dateKeyFor(reading.recordedAt) === date);
    const assetsWithReadings = new Set(readings.map((reading) => reading.assetId));
    const reportAssets = assets.filter(
      (asset) => monitoredAssetIds.has(asset.id) || assetsWithReadings.has(asset.id),
    );
    const entries = reportAssets
      .map((asset) => this.buildDailyLogEntry(asset, readings, iotDevices))
      .sort((a, b) => b.totalReadings - a.totalReadings || a.assetName.localeCompare(b.assetName));
    const expectedReadings = entries.reduce((total, entry) => total + entry.expectedReadings, 0);

    return new DailyLog(
      Number(date.replaceAll('-', '')) + safeOrganizationId,
      safeOrganizationId,
      date,
      new Date().toISOString(),
      expectedReadings,
      entries,
    );
  }

  buildOperationalHistory(
    organizationId: number | null,
    filters: OperationalHistoryFilters,
  ): OperationalHistory {
    const assets = this.assetManagementStore.assetsForOrganization(organizationId);
    const settings = this.assetManagementStore
      .assetSettings()
      .find((assetSettings) => assetSettings.organizationId === organizationId);
    const assetIds = assets.map((asset) => asset.id);
    const readings = this.monitoringStore
      .readingsForAssetIds(assetIds)
      .filter((reading) => this.isInDateRange(reading.recordedAt, filters.fromDate, filters.toDate))
      .filter((reading) => !filters.assetId || reading.assetId === filters.assetId);
    const readingEvents = readings.map((reading) =>
      this.historyReadingEvent(reading, assets, settings),
    );
    const alertEvents = readings
      .filter((reading) => reading.isOutOfRange)
      .map((reading) => this.historyAlertEvent(reading, assets, settings));
    const incidentEvents = assets
      .filter((asset) => !filters.assetId || asset.id === filters.assetId)
      .flatMap((asset) => this.historyIncidentEvents(asset, filters, readings));
    const events = [...readingEvents, ...alertEvents, ...incidentEvents]
      .filter((event) => filters.eventType === 'all' || event.eventType === filters.eventType)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    return new OperationalHistory(filters, events);
  }

  createDailyLogReport(organizationId: number | null, dailyLog: DailyLog): Observable<Report> {
    if (!organizationId) {
      return of(this.reportFromDailyLog(0, dailyLog));
    }

    const existingReport = this.reports().find((report) => {
      return (
        report.organizationId === organizationId &&
        report.type === ReportType.DailyLog &&
        report.periodDate === dailyLog.date
      );
    });

    if (existingReport) {
      return of(existingReport);
    }

    const report = this.reportFromDailyLog(organizationId, dailyLog);

    return this.reportsApi.createReport(report).pipe(
      tap((createdReport) => {
        this.reportsSignal.update((reports) => [...reports, createdReport]);
      }),
    );
  }

  private buildDailyLogEntry(
    asset: Asset,
    readings: SensorReading[],
    iotDevices: IoTDevice[],
  ): DailyLogEntry {
    const assetDevices = iotDevices.filter((iotDevice) => iotDevice.assetId === asset.id);
    const assetReadings = readings
      .filter((reading) => reading.assetId === asset.id)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    const temperatureReadings = assetReadings
      .map((reading) => reading.temperature)
      .filter((value): value is number => value !== null);
    const humidityReadings = assetReadings
      .map((reading) => reading.humidity)
      .filter((value): value is number => value !== null);
    const expectedReadings = this.expectedDailyReadingsFor(assetDevices, assetReadings.length);
    const missingReadings = Math.max(expectedReadings - assetReadings.length, 0);

    return {
      assetId: asset.id,
      assetName: asset.name,
      assetLocation: asset.location,
      totalReadings: assetReadings.length,
      expectedReadings,
      averageTemperature: this.average(temperatureReadings),
      averageHumidity: this.average(humidityReadings),
      outOfRangeCount: assetReadings.filter((reading) => reading.isOutOfRange).length,
      missingReadings,
      firstRecordedAt: assetReadings[0]?.recordedAt ?? null,
      lastRecordedAt: assetReadings[assetReadings.length - 1]?.recordedAt ?? null,
      status: this.entryStatus(assetReadings.length, missingReadings),
    };
  }

  private entryStatus(totalReadings: number, missingReadings: number): DailyLogStatus {
    if (!totalReadings) {
      return 'no-data';
    }

    return missingReadings > 0 ? 'incomplete' : 'complete';
  }

  private expectedDailyReadingsFor(iotDevices: IoTDevice[], fallbackReadings: number): number {
    if (!iotDevices.length) {
      return fallbackReadings;
    }

    return iotDevices.reduce((total, iotDevice) => {
      return total + this.expectedReadingsForFrequency(iotDevice.readingFrequencySeconds);
    }, 0);
  }

  private expectedReadingsForFrequency(readingFrequencySeconds: number): number {
    const secondsPerDay = 86400;
    const safeFrequency = readingFrequencySeconds > 0 ? readingFrequencySeconds : 3600;

    return Math.ceil(secondsPerDay / safeFrequency);
  }

  private average(values: number[]): number | null {
    if (!values.length) {
      return null;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return Number((total / values.length).toFixed(1));
  }

  private historyReadingEvent(
    reading: SensorReading,
    assets: Asset[],
    settings: AssetSettings | undefined,
  ): OperationalHistoryEvent {
    const asset = this.assetForReading(reading, assets);

    return {
      id: reading.id,
      assetId: reading.assetId,
      assetName: asset?.name ?? `#${reading.assetId}`,
      assetLocation: asset?.location ?? 'N/A',
      eventType: 'reading',
      severity: reading.isOutOfRange ? 'warning' : 'normal',
      icon: 'sensors',
      occurredAt: reading.recordedAt,
      value: this.readingValueLabel(reading),
      messageKey: reading.isOutOfRange
        ? 'reports.history.messages.reading-out-of-range'
        : 'reports.history.messages.reading-in-range',
      messageParams: {
        range: this.temperatureRangeLabel(settings),
      },
    };
  }

  private historyAlertEvent(
    reading: SensorReading,
    assets: Asset[],
    settings: AssetSettings | undefined,
  ): OperationalHistoryEvent {
    const asset = this.assetForReading(reading, assets);
    const severity = this.readingSeverity(reading, settings);

    return {
      id: 100000 + reading.id,
      assetId: reading.assetId,
      assetName: asset?.name ?? `#${reading.assetId}`,
      assetLocation: asset?.location ?? 'N/A',
      eventType: 'alert',
      severity,
      icon: this.alertIcon(reading, settings),
      occurredAt: reading.recordedAt,
      value: this.readingValueLabel(reading),
      messageKey: this.alertMessageKey(reading, settings),
      messageParams: {
        range: this.temperatureRangeLabel(settings),
      },
    };
  }

  private historyIncidentEvents(
    asset: Asset,
    filters: OperationalHistoryFilters,
    readings: SensorReading[],
  ): OperationalHistoryEvent[] {
    const occurredAt = this.incidentOccurredAt(asset, filters, readings);

    if (!this.isInDateRange(occurredAt, filters.fromDate, filters.toDate)) {
      return [];
    }

    const incidents: OperationalHistoryEvent[] = [];
    const incidentKey = this.normalizeIncident(asset.lastIncident);

    if (incidentKey !== 'none') {
      incidents.push({
        id: 200000 + asset.id,
        assetId: asset.id,
        assetName: asset.name,
        assetLocation: asset.location,
        eventType: 'incident',
        severity: incidentKey === 'connection-lost' ? 'critical' : 'warning',
        icon: incidentKey === 'connection-lost' ? 'wifi_off' : 'report_problem',
        occurredAt,
        value: asset.currentTemperature,
        messageKey: `reports.history.incidents.${incidentKey}`,
        messageParams: {},
      });
    }

    if (asset.connectivity !== ConnectivityStatus.Online) {
      incidents.push({
        id: 300000 + asset.id,
        assetId: asset.id,
        assetName: asset.name,
        assetLocation: asset.location,
        eventType: 'incident',
        severity: asset.connectivity === ConnectivityStatus.Offline ? 'critical' : 'warning',
        icon: 'wifi_off',
        occurredAt,
        value: asset.connectivity,
        messageKey: 'reports.history.incidents.connectivity',
        messageParams: {
          status: asset.connectivity,
        },
      });
    }

    return incidents;
  }

  private assetForReading(reading: SensorReading, assets: Asset[]): Asset | undefined {
    return assets.find((asset) => asset.id === reading.assetId);
  }

  private readingSeverity(
    reading: SensorReading,
    settings: AssetSettings | undefined,
  ): OperationalHistorySeverity {
    if (
      settings &&
      reading.temperature !== null &&
      (reading.temperature > settings.maximumTemperature + 2 ||
        reading.temperature < settings.minimumTemperature - 2)
    ) {
      return 'critical';
    }

    if (
      (settings && reading.humidity !== null && reading.humidity > settings.maximumHumidity) ||
      (reading.batteryLevel !== null && reading.batteryLevel < 15) ||
      (reading.signalStrength !== null && reading.signalStrength < 35)
    ) {
      return 'warning';
    }

    return reading.isOutOfRange ? 'warning' : 'normal';
  }

  private alertIcon(reading: SensorReading, settings: AssetSettings | undefined): string {
    if (settings && reading.humidity !== null && reading.humidity > settings.maximumHumidity) {
      return 'water_drop';
    }

    if (reading.batteryLevel !== null && reading.batteryLevel < 15) {
      return 'battery_alert';
    }

    if (reading.signalStrength !== null && reading.signalStrength < 35) {
      return 'signal_cellular_connected_no_internet_0_bar';
    }

    return reading.temperature !== null &&
      settings &&
      reading.temperature < settings.minimumTemperature
      ? 'ac_unit'
      : 'device_thermostat';
  }

  private alertMessageKey(reading: SensorReading, settings: AssetSettings | undefined): string {
    if (settings && reading.humidity !== null && reading.humidity > settings.maximumHumidity) {
      return 'reports.history.messages.high-humidity';
    }

    if (reading.batteryLevel !== null && reading.batteryLevel < 15) {
      return 'reports.history.messages.low-battery';
    }

    if (reading.signalStrength !== null && reading.signalStrength < 35) {
      return 'reports.history.messages.low-signal';
    }

    return settings &&
      reading.temperature !== null &&
      reading.temperature > settings.maximumTemperature
      ? 'reports.history.messages.high-temperature'
      : 'reports.history.messages.low-temperature';
  }

  private readingValueLabel(reading: SensorReading): string {
    const values = [
      reading.temperature !== null ? `${reading.temperature.toFixed(1)} °C` : null,
      reading.humidity !== null ? `${reading.humidity}%` : null,
      reading.batteryLevel !== null ? `${reading.batteryLevel}% battery` : null,
      reading.signalStrength !== null ? `${reading.signalStrength}% signal` : null,
    ].filter((value): value is string => !!value);

    return values.join(' / ') || 'N/A';
  }

  private incidentOccurredAt(
    asset: Asset,
    filters: OperationalHistoryFilters,
    readings: SensorReading[],
  ): string {
    const latestReading = readings
      .filter((reading) => reading.assetId === asset.id)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];

    return latestReading?.recordedAt ?? `${filters.toDate}T23:59:00`;
  }

  private normalizeIncident(lastIncident: string): string {
    const prefix = 'asset-management.incidents.';

    return lastIncident.startsWith(prefix)
      ? lastIncident.replace(prefix, '')
      : lastIncident || 'none';
  }

  private temperatureRangeLabel(settings: AssetSettings | undefined): string {
    if (!settings) {
      return 'N/A';
    }

    return `${settings.minimumTemperature} °C - ${settings.maximumTemperature} °C`;
  }

  private isInDateRange(value: string, fromDate: string, toDate: string): boolean {
    const dateKey = this.dateKeyFor(value);

    return dateKey >= fromDate && dateKey <= toDate;
  }

  private reportFromDailyLog(organizationId: number, dailyLog: DailyLog): Report {
    return new Report(
      this.nextReportId(),
      organizationId,
      this.dailyLogUuid(organizationId, dailyLog.date),
      ReportType.DailyLog,
      'Daily thermal control log',
      dailyLog.date,
      new Date().toISOString(),
    );
  }

  private nextReportId(): number {
    return Math.max(...this.reports().map((report) => report.id), 0) + 1;
  }

  private dailyLogUuid(organizationId: number, date: string): string {
    return `RPT-DL-${date.replaceAll('-', '')}-${organizationId.toString().padStart(3, '0')}`;
  }

  private today(): string {
    return this.formatDateKey(new Date());
  }

  private dateKeyFor(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value.slice(0, 10);
    }

    return this.formatDateKey(date);
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
