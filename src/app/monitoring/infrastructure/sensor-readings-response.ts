import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface SensorReadingResource extends BaseResource {
  assetId: number;
  iotDeviceId: number;
  temperature: number | null;
  humidity: number | null;
  isOutOfRange: boolean;
  recordedAt: string;
  motionDetected?: boolean | null;
  imageCaptured?: boolean | null;
  batteryLevel?: number | null;
  signalStrength?: number | null;
}

export interface SensorReadingsResponse extends BaseResponse {
  sensorReadings: SensorReadingResource[];
}
