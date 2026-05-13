import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * @summary Raw asset settings resource from the ColdTrace API.
 */
export interface AssetSettingsResource extends BaseResource {
  organizationId: number;
  uuid: string;
  assetTypes: string[];
  iotDeviceTypes: string[];
  minimumTemperature: number;
  maximumTemperature: number;
  maximumHumidity: number;
  calibrationFrequencyDays: number;
  temperatureUnit: string;
  humidityUnit: string;
  weightUnit: string;
  assetId?: number | null;
}

/**
 * @summary Raw response from the ColdTrace API for asset settings.
 */
export interface AssetSettingsResponse extends BaseResponse {
  assetSettings: AssetSettingsResource[];
}
