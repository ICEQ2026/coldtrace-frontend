import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { CalibrationStatus } from './calibration-status.enum';
import { SensorStatus } from './sensor-status.enum';

export class Sensor implements BaseEntity {
  constructor(
    private readonly _id: number,
    private readonly _organizationId: number,
    private readonly _uuid: string,
    private readonly _model: string,
    private readonly _measurementType: string,
    private readonly _assetId: number | null,
    private readonly _gatewayId: number | null,
    private readonly _status: SensorStatus,
    private readonly _calibrationStatus: CalibrationStatus,
    private readonly _lastCalibrationDate: string,
    private readonly _nextCalibrationDate: string,
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

  get model(): string {
    return this._model;
  }

  get measurementType(): string {
    return this._measurementType;
  }

  get assetId(): number | null {
    return this._assetId;
  }

  get gatewayId(): number | null {
    return this._gatewayId;
  }

  get status(): SensorStatus {
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
