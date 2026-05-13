import { AssetSettings } from './asset-settings.entity';

/**
 * @summary Groups the default operational configuration applied when an organization has no stored asset settings yet.
 */
export const DEFAULT_ASSET_SETTING_VALUES = {
  assetTypes: ['Cold room', 'Refrigerated transport'],
  iotDeviceTypes: [
    'Temperature sensor',
    'Humidity sensor',
    'Motion sensor',
    'Camera',
    'Multi-sensor',
  ],
  minimumTemperature: -5,
  maximumTemperature: 8,
  maximumHumidity: 85,
  calibrationFrequencyDays: 180,
  temperatureUnit: '°C',
  humidityUnit: '%',
  weightUnit: 'kg',
};

/**
 * @summary Creates a default settings entity while reusing an optional fallback profile.
 */
export function buildDefaultAssetSettings(
  id: number,
  organizationId: number,
  uuid: string,
  assetId: number | null = null,
  fallbackSettings: AssetSettings | null = null,
): AssetSettings {
  return new AssetSettings(
    id,
    organizationId,
    uuid,
    [...(fallbackSettings?.assetTypes ?? DEFAULT_ASSET_SETTING_VALUES.assetTypes)],
    [...(fallbackSettings?.iotDeviceTypes ?? DEFAULT_ASSET_SETTING_VALUES.iotDeviceTypes)],
    fallbackSettings?.minimumTemperature ?? DEFAULT_ASSET_SETTING_VALUES.minimumTemperature,
    fallbackSettings?.maximumTemperature ?? DEFAULT_ASSET_SETTING_VALUES.maximumTemperature,
    fallbackSettings?.maximumHumidity ?? DEFAULT_ASSET_SETTING_VALUES.maximumHumidity,
    fallbackSettings?.calibrationFrequencyDays ??
      DEFAULT_ASSET_SETTING_VALUES.calibrationFrequencyDays,
    fallbackSettings?.temperatureUnit ?? DEFAULT_ASSET_SETTING_VALUES.temperatureUnit,
    fallbackSettings?.humidityUnit ?? DEFAULT_ASSET_SETTING_VALUES.humidityUnit,
    fallbackSettings?.weightUnit ?? DEFAULT_ASSET_SETTING_VALUES.weightUnit,
    assetId,
  );
}
