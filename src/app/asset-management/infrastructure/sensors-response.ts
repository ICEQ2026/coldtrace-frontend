import { CalibrationStatus } from '../domain/model/calibration-status.enum';
import { SensorStatus } from '../domain/model/sensor-status.enum';
import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface SensorResource extends BaseResource {
  organizationId: number;
  uuid: string;
  model: string;
  measurementType: string;
  assetId: number | null;
  gatewayId: number | null;
  status: SensorStatus;
  calibrationStatus: CalibrationStatus;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
}

export interface SensorsResponse extends BaseResponse {
  sensors: SensorResource[];
}
