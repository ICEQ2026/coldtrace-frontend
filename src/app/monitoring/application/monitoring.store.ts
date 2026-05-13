import { computed, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AssetManagementStore } from '../../asset-management/application/asset-management.store';
import { AssetSettings } from '../../asset-management/domain/model/asset-settings.entity';
import { Asset } from '../../asset-management/domain/model/asset.entity';
import { ConnectivityStatus } from '../../asset-management/domain/model/connectivity-status.enum';
import { Gateway } from '../../asset-management/domain/model/gateway.entity';
import { GatewayStatus } from '../../asset-management/domain/model/gateway-status.enum';
import { IoTDevice } from '../../asset-management/domain/model/iot-device.entity';
import { IoTDeviceStatus } from '../../asset-management/domain/model/iot-device-status.enum';
import { OfflineReading } from '../domain/model/offline-reading.entity';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { SyncStatus } from '../domain/model/sync-status.enum';
import { MonitoringApi } from '../infrastructure/monitoring-api';

/**
 * @summary Manages monitoring state and workflows for presentation components.
 */
@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private readonly readingsSignal = signal<SensorReading[]>([]);
  private readonly offlineReadingsSignal = signal<OfflineReading[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly readings = this.readingsSignal.asReadonly();
  readonly offlineReadings = this.offlineReadingsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly totalAssets = computed(
    () => new Set(this.readings().map((reading) => reading.assetId)).size,
  );
  readonly assetsWithAlerts = computed(
    () =>
      new Set(
        this.readings()
          .filter((reading) => reading.isOutOfRange)
          .map((reading) => reading.assetId),
      ).size,
  );
  readonly outOfRangeReadings = computed(() =>
    this.readings().filter((reading) => reading.isOutOfRange),
  );

  readonly pendingCount = computed(
    () => this.offlineReadings().filter((reading) => reading.isPending).length,
  );
  readonly syncedCount = computed(
    () => this.offlineReadings().filter((reading) => reading.isSynced).length,
  );
  readonly failedCount = computed(
    () => this.offlineReadings().filter((reading) => reading.isFailed).length,
  );

  private readonly seededOrganizationIds = new Set<number>();

  constructor(
    private monitoringApi: MonitoringApi,
    private assetManagementStore: AssetManagementStore,
  ) {}

  /**
   * @summary Loads readings data into local state.
   */
  loadReadings(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.monitoringApi.getSensorReadings().subscribe({
      next: (readings) => {
        this.readingsSignal.set(readings);
        this.loadingSignal.set(false);
        this.initOfflineReadings(readings);
      },
      error: (error) => {
        this.errorSignal.set(this.formatError(error, 'Failed to load sensor readings'));
        this.loadingSignal.set(false);
      },
    });
  }

  /**
   * @summary Persists a sensor reading and appends it to local state.
   */
  createSensorReading(sensorReading: SensorReading): Observable<SensorReading> {
    return this.monitoringApi.createSensorReading(sensorReading).pipe(
      tap((createdReading) => {
        this.readingsSignal.update((readings) => [...readings, createdReading]);
      }),
    );
  }

  /**
   * @summary Calculates the next sensor reading id value.
   */
  nextSensorReadingId(offset = 0): number {
    return Math.max(...this.readings().map((reading) => reading.id), 0) + 1 + offset;
  }

  /**
   * @summary Returns the latest temperature recorded for one asset.
   */
  getLatestTemperatureByAsset(assetId: number): number | null {
    const sorted = this.readings()
      .filter((reading) => reading.assetId === assetId && reading.temperature !== null)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return sorted.length > 0 ? sorted[0].temperature : null;
  }

  /**
   * @summary Returns the latest humidity recorded for one asset.
   */
  getLatestHumidityByAsset(assetId: number): number | null {
    const sorted = this.readings()
      .filter((reading) => reading.assetId === assetId && reading.humidity !== null)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return sorted.length > 0 ? sorted[0].humidity : null;
  }

  /**
   * @summary Returns sorted readings for an asset within an optional date range.
   */
  getReadingsByAsset(assetId: number, from?: string, to?: string): SensorReading[] {
    return this.readings()
      .filter((reading) => {
        if (reading.assetId !== assetId) return false;
        const time = new Date(reading.recordedAt).getTime();
        if (from && time < new Date(from).getTime()) return false;
        if (to && time > new Date(to).getTime() + 86399999) return false;
        return true;
      })
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  /**
   * @summary Returns sorted readings for a set of assets.
   */
  readingsForAssetIds(assetIds: number[]): SensorReading[] {
    const assetIdSet = new Set(assetIds);

    return this.readings()
      .filter((reading) => assetIdSet.has(reading.assetId))
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  /**
   * @summary Returns the latest readings for dashboard cards.
   */
  recentReadingsForAssetIds(assetIds: number[], limit = 6): SensorReading[] {
    return this.readingsForAssetIds(assetIds).slice(0, limit);
  }

  /**
   * @summary Returns readings for assets recorded between a date and now.
   */
  readingsForAssetIdsSince(assetIds: number[], since: Date): SensorReading[] {
    const sinceTime = since.getTime();
    const nowTime = Date.now();

    return this.readingsForAssetIds(assetIds).filter((reading) => {
      const readingTime = new Date(reading.recordedAt).getTime();
      return readingTime >= sinceTime && readingTime <= nowTime;
    });
  }

  /**
   * @summary Counts out-of-range readings for selected assets.
   */
  outOfRangeCountForAssetIds(assetIds: number[]): number {
    return this.readingsForAssetIds(assetIds).filter((reading) => reading.isOutOfRange).length;
  }

  /**
   * @summary Calculates the percentage of in-range readings for selected assets.
   */
  thermalComplianceForAssetIds(assetIds: number[]): number {
    const readings = this.readingsForAssetIds(assetIds);

    if (!readings.length) {
      return 0;
    }

    const inRangeReadings = readings.filter((reading) => !reading.isOutOfRange).length;
    return Math.round((inRangeReadings / readings.length) * 100);
  }

  /**
   * @summary Marks one offline reading as synced.
   */
  syncReading(id: number): void {
    this.offlineReadingsSignal.update((list) =>
      list.map((reading) =>
        reading.id === id ? reading.withSyncStatus(SyncStatus.Synced) : reading,
      ),
    );
  }

  /**
   * @summary Marks all pending offline readings as synced.
   */
  syncAllPending(): void {
    this.offlineReadingsSignal.update((list) =>
      list.map((reading) =>
        reading.isPending ? reading.withSyncStatus(SyncStatus.Synced) : reading,
      ),
    );
  }

  /**
   * @summary Simulates telemetry status changes for one organization.
   */
  updateOrganizationTelemetry(organizationId: number | null): void {
    if (!organizationId) {
      return;
    }

    const assets = this.assetManagementStore.assetsForOrganization(organizationId);
    const iotDevices = this.assetManagementStore.iotDevicesForOrganization(organizationId);
    const gateways = this.assetManagementStore.gatewaysForOrganization(organizationId);

    // Seed recent readings once so report screens have current-day evidence to process.
    this.ensureRecentReadingsForOrganization(organizationId, assets, iotDevices);

    const monitoredAssets = assets.filter((asset) =>
      iotDevices.some((iotDevice) => iotDevice.assetId === asset.id),
    );
    const asset = this.sampleOne(monitoredAssets.length ? monitoredAssets : assets);

    if (!asset) {
      return;
    }

    const iotDevice = iotDevices.find((device) => device.assetId === asset.id) ?? null;
    const gateway =
      gateways.find((currentGateway) => currentGateway.id === asset.gatewayId) ?? null;
    const connectivity = this.randomConnectivity(gateway, iotDevice);
    const settings = this.assetManagementStore.settingsForAsset(organizationId, asset.id);
    const reading = this.buildSensorReading(asset, iotDevice, settings, connectivity);

    if (reading) {
      this.createSensorReading(reading).subscribe({ error: () => undefined });
    }
  }

  private buildSensorReading(
    asset: Asset,
    iotDevice: IoTDevice | null,
    settings: AssetSettings | undefined,
    connectivity: ConnectivityStatus,
    offset = 0,
    recordedAt = new Date(),
  ): SensorReading | null {
    if (!iotDevice || connectivity === ConnectivityStatus.Offline) {
      return null;
    }

    const parameters = iotDevice.measurementParameters;
    const temperature = parameters.includes('temperature') && settings
      ? this.randomTemperatureReading(settings.minimumTemperature, settings.maximumTemperature)
      : null;
    const humidity = parameters.includes('humidity') && settings
      ? this.randomHumidityReading(settings.maximumHumidity)
      : null;
    const motionDetected = parameters.includes('motion') ? Math.random() < 0.18 : null;
    const imageCaptured = parameters.includes('image') ? Math.random() < 0.35 : null;
    const batteryLevel = parameters.includes('battery') ? this.randomBatteryLevel() : null;
    const signalStrength = parameters.includes('signal') ? this.randomSignalStrength() : null;
    const environmentOutOfRange = settings
      ? (temperature !== null &&
          (temperature < settings.minimumTemperature || temperature > settings.maximumTemperature)) ||
        (humidity !== null && humidity > settings.maximumHumidity)
      : false;
    // One computed flag keeps charts, alerts, and reports aligned around the same risk rule.
    const isOutOfRange =
      environmentOutOfRange ||
      (batteryLevel !== null && batteryLevel < 15) ||
      (signalStrength !== null && signalStrength < 35);

    return new SensorReading(
      this.nextSensorReadingId(offset),
      asset.id,
      iotDevice.id,
      temperature,
      humidity,
      isOutOfRange,
      recordedAt.toISOString(),
      motionDetected,
      imageCaptured,
      batteryLevel,
      signalStrength,
    );
  }

  private ensureRecentReadingsForOrganization(
    organizationId: number,
    assets: Asset[],
    iotDevices: IoTDevice[],
  ): void {
    if (this.seededOrganizationIds.has(organizationId)) {
      return;
    }

    const assetIds = assets.map((asset) => asset.id);
    const since = new Date();
    since.setHours(since.getHours() - 24);

    if (this.readingsForAssetIdsSince(assetIds, since).length) {
      this.seededOrganizationIds.add(organizationId);
      return;
    }

    iotDevices
      .filter((iotDevice) => iotDevice.assetId !== null)
      .slice(0, 8)
      .forEach((iotDevice, index) => {
        const asset = assets.find((currentAsset) => currentAsset.id === iotDevice.assetId);

        if (!asset) {
          return;
        }

        const recordedAt = new Date();
        recordedAt.setHours(recordedAt.getHours() - (8 - index));
        const settings = this.assetManagementStore.settingsForAsset(organizationId, asset.id);
        const reading = this.buildSensorReading(
          asset,
          iotDevice,
          settings,
          ConnectivityStatus.Online,
          index,
          recordedAt,
        );

        if (reading) {
          this.createSensorReading(reading).subscribe({ error: () => undefined });
        }
      });

    this.seededOrganizationIds.add(organizationId);
  }

  private randomConnectivity(
    gateway: Gateway | null,
    iotDevice: IoTDevice | null,
  ): ConnectivityStatus {
    if (
      !iotDevice ||
      gateway?.status === GatewayStatus.Offline ||
      iotDevice.status === IoTDeviceStatus.Offline
    ) {
      return ConnectivityStatus.Offline;
    }

    if (gateway?.status === GatewayStatus.Maintenance) {
      return Math.random() < 0.75 ? ConnectivityStatus.Online : ConnectivityStatus.Unstable;
    }

    const randomValue = Math.random();

    if (randomValue < 0.92) {
      return ConnectivityStatus.Online;
    }

    if (randomValue < 0.98) {
      return ConnectivityStatus.Unstable;
    }

    return ConnectivityStatus.Offline;
  }

  private randomTemperatureReading(minimumTemperature: number, maximumTemperature: number): number {
    const anomalyRoll = Math.random();

    if (anomalyRoll < 0.94) {
      return Number(this.randomNumber(minimumTemperature, maximumTemperature).toFixed(1));
    }

    if (anomalyRoll < 0.97) {
      return Number(this.randomNumber(minimumTemperature - 2, minimumTemperature - 0.2).toFixed(1));
    }

    return Number(this.randomNumber(maximumTemperature + 0.2, maximumTemperature + 3).toFixed(1));
  }

  private randomHumidityReading(maximumHumidity: number): number {
    const normalMinimum = Math.max(0, maximumHumidity - 30);

    if (Math.random() < 0.94) {
      return Math.round(this.randomNumber(normalMinimum, maximumHumidity));
    }

    return Math.round(this.randomNumber(maximumHumidity + 1, maximumHumidity + 8));
  }

  private randomBatteryLevel(): number {
    if (Math.random() < 0.96) {
      return Math.round(this.randomNumber(20, 100));
    }

    return Math.round(this.randomNumber(8, 14));
  }

  private randomSignalStrength(): number {
    if (Math.random() < 0.96) {
      return Math.round(this.randomNumber(40, 100));
    }

    return Math.round(this.randomNumber(28, 34));
  }

  private randomNumber(minimum: number, maximum: number): number {
    return minimum + Math.random() * (maximum - minimum);
  }

  private sampleOne<T>(items: T[]): T | null {
    if (!items.length) {
      return null;
    }

    return items[Math.floor(Math.random() * items.length)];
  }

  private initOfflineReadings(readings: SensorReading[]): void {
    if (this.offlineReadings().length > 0) return;
    const sorted = [...readings].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
    const offline = sorted
      .filter((reading) => reading.temperature !== null && reading.humidity !== null)
      .slice(0, 6)
      .map(
        (reading, index) =>
          new OfflineReading(
            reading.id,
            reading.assetId,
            reading.iotDeviceId,
            reading.temperature ?? 0,
            reading.humidity ?? 0,
            reading.recordedAt,
            index < 3 ? SyncStatus.Pending : index === 3 ? SyncStatus.Failed : SyncStatus.Synced,
          ),
      );
    this.offlineReadingsSignal.set(offline);
  }

  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message;
    return fallback;
  }
}
