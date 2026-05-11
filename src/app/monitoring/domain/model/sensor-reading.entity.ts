export class SensorReading {
  constructor(
    public id: number,
    public assetId: number,
    public iotDeviceId: number,
    public temperature: number,
    public humidity: number,
    public isOutOfRange: boolean,
    public recordedAt: string
  ) {}
}
