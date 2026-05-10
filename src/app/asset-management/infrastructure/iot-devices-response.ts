import { CalibrationStatus } from '../domain/model/calibration-status.enum';
import { IoTDeviceStatus } from '../domain/model/iot-device-status.enum';
import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface IoTDeviceResource extends BaseResource {
  organizationId: number;
  uuid: string;
  deviceType: string;
  model: string;
  measurementType: string;
  assetId: number | null;
  status: IoTDeviceStatus;
  calibrationStatus: CalibrationStatus;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
}

export interface IoTDevicesResponse extends BaseResponse {
  iotDevices: IoTDeviceResource[];
}
