import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { ReadingStatus } from '../domain/model/sensor-reading.entity';

export interface SensorReadingResource extends BaseResource {
  assetId: number;
  iotDeviceId: number;
  temperature: number;
  humidity: number;
  recordedAt: string;
  status: ReadingStatus;
}

export interface SensorReadingsResponse extends BaseResponse {
  sensorReadings: SensorReadingResource[];
}
