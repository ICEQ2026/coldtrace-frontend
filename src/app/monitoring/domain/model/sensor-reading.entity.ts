export type ReadingStatus = 'normal' | 'out-of-range' | 'unknown';

export class SensorReading {
  constructor(
    private _id: number,
    private _assetId: number,
    private _iotDeviceId: number,
    private _temperature: number,
    private _humidity: number,
    private _recordedAt: string,
    private _status: ReadingStatus,
  ) {}

  get id(): number {
    return this._id;
  }

  get assetId(): number {
    return this._assetId;
  }

  get iotDeviceId(): number {
    return this._iotDeviceId;
  }

  get temperature(): number {
    return this._temperature;
  }

  get humidity(): number {
    return this._humidity;
  }

  get recordedAt(): string {
    return this._recordedAt;
  }

  get status(): ReadingStatus {
    return this._status;
  }

  get isOutOfRange(): boolean {
    return this._status === 'out-of-range';
  }
}
