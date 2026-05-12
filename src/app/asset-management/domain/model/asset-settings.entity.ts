import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class AssetSettings implements BaseEntity {
  constructor(
    private readonly _id: number,
    private readonly _organizationId: number,
    private readonly _uuid: string,
    private readonly _assetTypes: string[],
    private readonly _iotDeviceTypes: string[],
    private readonly _minimumTemperature: number,
    private readonly _maximumTemperature: number,
    private readonly _maximumHumidity: number,
    private readonly _calibrationFrequencyDays: number,
    private readonly _temperatureUnit: string,
    private readonly _humidityUnit: string,
    private readonly _weightUnit: string,
    private readonly _assetId: number | null = null,
  ) {}

  get id(): number {
    return this._id;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get uuid(): string {
    return this._uuid;
  }

  get assetTypes(): string[] {
    return this._assetTypes;
  }

  get iotDeviceTypes(): string[] {
    return this._iotDeviceTypes;
  }

  get minimumTemperature(): number {
    return this._minimumTemperature;
  }

  get maximumTemperature(): number {
    return this._maximumTemperature;
  }

  get maximumHumidity(): number {
    return this._maximumHumidity;
  }

  get calibrationFrequencyDays(): number {
    return this._calibrationFrequencyDays;
  }

  get temperatureUnit(): string {
    return this._temperatureUnit;
  }

  get humidityUnit(): string {
    return this._humidityUnit;
  }

  get weightUnit(): string {
    return this._weightUnit;
  }

  get assetId(): number | null {
    return this._assetId;
  }
}
