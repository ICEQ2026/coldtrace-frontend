import { SyncStatus } from './sync-status.enum';

export class OfflineReading {
  constructor(
    private _id: number,
    private _assetId: number,
    private _iotDeviceId: number,
    private _temperature: number,
    private _humidity: number | null,
    private _recordedAt: string,
    private _syncStatus: SyncStatus,
  ) {}

  get id(): number { return this._id; }
  get assetId(): number { return this._assetId; }
  get iotDeviceId(): number { return this._iotDeviceId; }
  get temperature(): number { return this._temperature; }
  get humidity(): number | null { return this._humidity; }
  get recordedAt(): string { return this._recordedAt; }
  get syncStatus(): SyncStatus { return this._syncStatus; }

  get isPending(): boolean  { return this._syncStatus === SyncStatus.Pending; }
  get isSynced(): boolean   { return this._syncStatus === SyncStatus.Synced; }
  get isFailed(): boolean   { return this._syncStatus === SyncStatus.Failed; }

  withSyncStatus(status: SyncStatus): OfflineReading {
    return new OfflineReading(
      this._id, this._assetId, this._iotDeviceId,
      this._temperature, this._humidity,
      this._recordedAt, status,
    );
  }
}
