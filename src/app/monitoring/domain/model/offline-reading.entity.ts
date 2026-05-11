import { SyncStatus } from './sync-status.enum';

export class OfflineReading {
  constructor(
    public id: number,
    public assetId: number,
    public iotDeviceId: number,
    public temperature: number,
    public humidity: number,
    public recordedAt: string,
    public syncStatus: SyncStatus
  ) {}

  get isPending(): boolean {
    return this.syncStatus === SyncStatus.Pending;
  }

  get isSynced(): boolean {
    return this.syncStatus === SyncStatus.Synced;
  }

  get isFailed(): boolean {
    return this.syncStatus === SyncStatus.Failed;
  }

  withSyncStatus(status: SyncStatus): OfflineReading {
    return new OfflineReading(
      this.id,
      this.assetId,
      this.iotDeviceId,
      this.temperature,
      this.humidity,
      this.recordedAt,
      status
    );
  }
}
