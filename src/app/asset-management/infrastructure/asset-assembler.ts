import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Asset } from '../domain/model/asset.entity';
import { AssetResource, AssetsResponse } from './assets-response';

/**
 * @summary Maps asset data between domain entities and API resources.
 */
export class AssetAssembler implements BaseAssembler<Asset, AssetResource, AssetsResponse> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: AssetsResponse): Asset[] {
    return response.assets.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: AssetResource): Asset {
    return new Asset(
      Number(resource.id),
      resource.organizationId,
      resource.uuid,
      resource.type,
      resource.gatewayId ?? null,
      resource.name,
      resource.location,
      resource.capacity,
      resource.description,
      resource.status,
      resource.lastIncident,
      resource.currentTemperature,
      resource.entryDate,
      resource.connectivity,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: Asset): AssetResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      type: entity.type,
      gatewayId: entity.gatewayId,
      name: entity.name,
      location: entity.location,
      capacity: entity.capacity,
      description: entity.description,
      status: entity.status,
      lastIncident: entity.lastIncident,
      currentTemperature: entity.currentTemperature,
      entryDate: entity.entryDate,
      connectivity: entity.connectivity,
    };
  }
}
