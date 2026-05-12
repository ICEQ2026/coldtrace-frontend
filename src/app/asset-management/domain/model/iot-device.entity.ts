import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { CalibrationStatus } from './calibration-status.enum';
import { IoTDeviceStatus } from './iot-device-status.enum';

export class IoTDevice implements BaseEntity {
  constructor(
    private readonly _id: number,
    private readonly _organizationId: number,
    private readonly _uuid: string,
    private readonly _deviceType: string,
    private readonly _model: string,
    private readonly _measurementType: string,
    private readonly _assetId: number | null,
    private readonly _status: IoTDeviceStatus,
    private readonly _calibrationStatus: CalibrationStatus,
    private readonly _lastCalibrationDate: string,
    private readonly _nextCalibrationDate: string,
    private readonly _measurementParameters: string[] = [],
    private readonly _readingFrequencySeconds: number = 3600,
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

  get deviceType(): string {
    return this._deviceType;
  }

  get model(): string {
    return this._model;
  }

  get measurementType(): string {
    return this._measurementType;
  }

  get measurementParameters(): string[] {
    return this._measurementParameters.length
      ? this._measurementParameters
      : this._measurementType
          .split('/')
          .map((parameter) => parameter.trim().toLowerCase().replace(/\s+/g, '-'))
          .filter((parameter) => !!parameter);
  }

  get readingFrequencySeconds(): number {
    return this._readingFrequencySeconds;
  }

  get assetId(): number | null {
    return this._assetId;
  }

  get status(): IoTDeviceStatus {
    return this._status;
  }

  get calibrationStatus(): CalibrationStatus {
    return this._calibrationStatus;
  }

  get lastCalibrationDate(): string {
    return this._lastCalibrationDate;
  }

  get nextCalibrationDate(): string {
    return this._nextCalibrationDate;
  }
}
