import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface SensorReadingResource extends BaseResource {
  assetId: number;
  iotDeviceId: number;
  temperature: number;
  humidity: number;
  isOutOfRange: boolean;
  recordedAt: string;
}

export interface SensorReadingsResponse extends BaseResponse {
  sensorReadings: SensorReadingResource[];
}
