import { computed, Injectable, signal } from '@angular/core';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { OfflineReading } from '../domain/model/offline-reading.entity';
import { SyncStatus } from '../domain/model/sync-status.enum';
import { MonitoringApi } from '../infrastructure/monitoring-api';

@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private readonly readingsSignal        = signal<SensorReading[]>([]);
  private readonly offlineReadingsSignal = signal<OfflineReading[]>([]);
  private readonly loadingSignal         = signal<boolean>(false);
  private readonly errorSignal           = signal<string | null>(null);

  readonly readings        = this.readingsSignal.asReadonly();
  readonly offlineReadings = this.offlineReadingsSignal.asReadonly();
  readonly loading         = this.loadingSignal.asReadonly();
  readonly error           = this.errorSignal.asReadonly();

  // US039
  readonly totalAssets = computed(() =>
    new Set(this.readings().map((r) => r.assetId)).size,
  );
  readonly assetsWithAlerts = computed(() =>
    new Set(this.readings().filter((r) => r.isOutOfRange).map((r) => r.assetId)).size,
  );

  // US021
  readonly outOfRangeReadings = computed(() =>
    this.readings().filter((r) => r.isOutOfRange),
  );

  // US023
  readonly pendingCount  = computed(() => this.offlineReadings().filter((r) => r.isPending).length);
  readonly syncedCount   = computed(() => this.offlineReadings().filter((r) => r.isSynced).length);
  readonly failedCount   = computed(() => this.offlineReadings().filter((r) => r.isFailed).length);

  constructor(private monitoringApi: MonitoringApi) {}

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

  // US018
  getLatestTemperatureByAsset(assetId: number): number | null {
    const s = this.readings()
      .filter((r) => r.assetId === assetId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return s.length > 0 ? s[0].temperature : null;
  }

  // US019
  getLatestHumidityByAsset(assetId: number): number | null {
    const s = this.readings()
      .filter((r) => r.assetId === assetId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    return s.length > 0 ? s[0].humidity : null;
  }

  // US020 — con filtro de fechas opcional
  getReadingsByAsset(assetId: number, from?: string, to?: string): SensorReading[] {
    return this.readings()
      .filter((r) => {
        if (r.assetId !== assetId) return false;
        const t = new Date(r.recordedAt).getTime();
        if (from && t < new Date(from).getTime()) return false;
        if (to   && t > new Date(to  ).getTime() + 86399999) return false;
        return true;
      })
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  // US023 — sincronizar un offline reading
  syncReading(id: number): void {
    this.offlineReadingsSignal.update((list) =>
      list.map((r) => r.id === id ? r.withSyncStatus(SyncStatus.Synced) : r),
    );
  }

  syncAllPending(): void {
    this.offlineReadingsSignal.update((list) =>
      list.map((r) => r.isPending ? r.withSyncStatus(SyncStatus.Synced) : r),
    );
  }

  // Simula lecturas offline a partir de las existentes (las 3 más recientes quedan como pending)
  private initOfflineReadings(readings: SensorReading[]): void {
    if (this.offlineReadings().length > 0) return;
    const sorted = [...readings].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
    const offline: OfflineReading[] = sorted.slice(0, 6).map((r, i) =>
      new OfflineReading(
        r.id, r.assetId, r.iotDeviceId,
        r.temperature, r.humidity,
        r.recordedAt,
        i < 3 ? SyncStatus.Pending : i === 3 ? SyncStatus.Failed : SyncStatus.Synced,
      ),
    );
    this.offlineReadingsSignal.set(offline);
  }

  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message;
    return fallback;
  }
}
