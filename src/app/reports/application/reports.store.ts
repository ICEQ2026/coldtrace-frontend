import { Injectable, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { AssetManagementStore } from '../../asset-management/application/asset-management.store';
import { Asset } from '../../asset-management/domain/model/asset.entity';
import { IoTDevice } from '../../asset-management/domain/model/iot-device.entity';
import { SensorReading } from '../../monitoring/domain/model/sensor-reading.entity';
import { MonitoringStore } from '../../monitoring/application/monitoring.store';
import { Report } from '../domain/model/report.entity';
import { ReportType } from '../domain/model/report-type.enum';
import { DailyLog, DailyLogEntry, DailyLogStatus } from '../domain/model/daily-log.entity';
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
