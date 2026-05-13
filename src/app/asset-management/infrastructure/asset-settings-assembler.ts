import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { AssetSettings } from '../domain/model/asset-settings.entity';
import { AssetSettingsResource, AssetSettingsResponse } from './asset-settings-response';

/**
 * @summary Maps asset settings data between domain entities and API resources.
 */
export class AssetSettingsAssembler implements BaseAssembler<
  AssetSettings,
  AssetSettingsResource,
  AssetSettingsResponse
> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: AssetSettingsResponse): AssetSettings[] {
    return response.assetSettings.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: AssetSettingsResource): AssetSettings {
    return new AssetSettings(
      Number(resource.id),
      resource.organizationId,
      resource.uuid,
      resource.assetTypes,
      resource.iotDeviceTypes,
      resource.minimumTemperature,
      resource.maximumTemperature,
      resource.maximumHumidity,
      resource.calibrationFrequencyDays,
      resource.temperatureUnit,
      resource.humidityUnit,
      resource.weightUnit,
      resource.assetId ?? null,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: AssetSettings): AssetSettingsResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      assetTypes: entity.assetTypes,
      iotDeviceTypes: entity.iotDeviceTypes,
      minimumTemperature: entity.minimumTemperature,
      maximumTemperature: entity.maximumTemperature,
      maximumHumidity: entity.maximumHumidity,
      calibrationFrequencyDays: entity.calibrationFrequencyDays,
      temperatureUnit: entity.temperatureUnit,
      humidityUnit: entity.humidityUnit,
      weightUnit: entity.weightUnit,
      assetId: entity.assetId,
    };
  }
}
