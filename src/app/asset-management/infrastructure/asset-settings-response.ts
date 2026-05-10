import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

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
}

export interface AssetSettingsResponse extends BaseResponse {
  assetSettings: AssetSettingsResource[];
}
