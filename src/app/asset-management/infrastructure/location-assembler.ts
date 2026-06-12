import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Location } from '../domain/model/location.entity';
import { LocationResource, LocationsResponse } from './locations-response';

/**
 * @summary Maps location data between domain entities and API resources.
 */
export class LocationAssembler
  implements BaseAssembler<Location, LocationResource, LocationsResponse>
{
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: LocationsResponse): Location[] {
    return response.locations.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: LocationResource): Location {
    return new Location(
      Number(resource.id),
      resource.organizationId,
      resource.name,
      resource.type,
      resource.address ?? '',
      resource.description ?? '',
      resource.status,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: Location): LocationResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      name: entity.name,
      type: entity.type,
      address: entity.address,
      description: entity.description,
      status: entity.status,
    };
  }
}
