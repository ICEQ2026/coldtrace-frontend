import { computed, Injectable, signal } from '@angular/core';
import { OfflineReading } from '../domain/model/offline-reading.entity';
import { OperationalDashboardData } from '../domain/model/operational-dashboard-data.entity';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { SyncStatus } from '../domain/model/sync-status.enum';
import { MonitoringApi } from '../infrastructure/monitoring-api';

@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private readonly readingsSignal = signal<SensorReading[]>([]);
  private readonly offlineReadingsSignal = signal<OfflineReading[]>([]);
  private readonly dashboardsSignal = signal<OperationalDashboardData[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly readings = this.readingsSignal.asReadonly();
  readonly offlineReadings = this.offlineReadingsSignal.asReadonly();
  readonly operationalDashboards = this.dashboardsSignal.asReadonly();
  readonly operationalDashboard = computed(() => this.operationalDashboards()[0] ?? null);
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly totalAssets = computed(() => new Set(this.readings().map(reading => reading.assetId)).size);
  readonly assetsWithAlerts = computed(() => new Set(this.readings().filter(reading => reading.isOutOfRange).map(reading => reading.assetId)).size);
  readonly outOfRangeReadings = computed(() => this.readings().filter(reading => reading.isOutOfRange));

  readonly pendingCount = computed(() => this.offlineReadings().filter(reading => reading.isPending).length);
  readonly syncedCount = computed(() => this.offlineReadings().filter(reading => reading.isSynced).length);
  readonly failedCount = computed(() => this.offlineReadings().filter(reading => reading.isFailed).length);

  constructor(private monitoringApi: MonitoringApi) {}

  loadDashboard(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.monitoringApi.getOperationalDashboards().subscribe({
      next: dashboards => {
        this.dashboardsSignal.set(dashboards);
        this.loadingSignal.set(false);
      },
      error: error => {
        this.errorSignal.set(this.formatError(error, 'Failed to load operational dashboard'));
        this.loadingSignal.set(false);
      },
    });
  }

  loadReadings(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.monitoringApi.getSensorReadings().subscribe({
      next: readings => {
        this.readingsSignal.set(readings);
        this.loadingSignal.set(false);
        this.initOfflineReadings(readings);
      },
      error: error => {
        this.errorSignal.set(this.formatError(error, 'Failed to load sensor readings'));
        this.loadingSignal.set(false);
      },
    });
  }

  getLatestTemperatureByAsset(assetId: number): number | null {
    const sorted = this.readings()
      .filter(reading => reading.assetId === assetId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return sorted.length > 0 ? sorted[0].temperature : null;
  }

  getLatestHumidityByAsset(assetId: number): number | null {
    const sorted = this.readings()
      .filter(reading => reading.assetId === assetId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return sorted.length > 0 ? sorted[0].humidity : null;
  }

  getReadingsByAsset(assetId: number, from?: string, to?: string): SensorReading[] {
    return this.readings()
      .filter(reading => {
        if (reading.assetId !== assetId) return false;
        const time = new Date(reading.recordedAt).getTime();
        if (from && time < new Date(from).getTime()) return false;
        if (to && time > new Date(to).getTime() + 86399999) return false;
        return true;
      })
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  readingsForAssetIds(assetIds: number[]): SensorReading[] {
    const assetIdSet = new Set(assetIds);

    return this.readings()
      .filter(reading => assetIdSet.has(reading.assetId))
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  recentReadingsForAssetIds(assetIds: number[], limit = 6): SensorReading[] {
    return this.readingsForAssetIds(assetIds).slice(0, limit);
  }

  outOfRangeCountForAssetIds(assetIds: number[]): number {
    return this.readingsForAssetIds(assetIds).filter(reading => reading.isOutOfRange).length;
  }

  thermalComplianceForAssetIds(assetIds: number[]): number {
    const readings = this.readingsForAssetIds(assetIds);

    if (!readings.length) {
      return 0;
    }

    const inRangeReadings = readings.filter(reading => !reading.isOutOfRange).length;
    return Math.round((inRangeReadings / readings.length) * 100);
  }

  syncReading(id: number): void {
    this.offlineReadingsSignal.update(list => list.map(reading => reading.id === id ? reading.withSyncStatus(SyncStatus.Synced) : reading));
  }

  syncAllPending(): void {
    this.offlineReadingsSignal.update(list => list.map(reading => reading.isPending ? reading.withSyncStatus(SyncStatus.Synced) : reading));
  }

  private initOfflineReadings(readings: SensorReading[]): void {
    if (this.offlineReadings().length > 0) return;
    const sorted = [...readings].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    const offline = sorted.slice(0, 6).map((reading, index) => new OfflineReading(
      reading.id,
      reading.assetId,
      reading.iotDeviceId,
      reading.temperature,
      reading.humidity,
      reading.recordedAt,
      index < 3 ? SyncStatus.Pending : index === 3 ? SyncStatus.Failed : SyncStatus.Synced,
    ));
    this.offlineReadingsSignal.set(offline);
  }

  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message;
    return fallback;
  }
}
