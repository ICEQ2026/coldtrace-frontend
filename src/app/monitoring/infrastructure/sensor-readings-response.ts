import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * @summary Raw sensor reading resource from the ColdTrace API.
 */
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

/**
 * @summary Raw response from the ColdTrace API for sensor readings.
 */
export interface SensorReadingsResponse extends BaseResponse {
  sensorReadings: SensorReadingResource[];
}
