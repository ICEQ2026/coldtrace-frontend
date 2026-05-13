import { BaseEntity } from './base-entity';
import { BaseResource, BaseResponse } from './base-response';

/**
 * @summary Contract for assemblers that translate between domain entities and API resources.
 */
export interface BaseAssembler<
  TEntity extends BaseEntity,
  TResource extends BaseResource,
  TResponse extends BaseResponse,
> {
  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: TResource): TEntity;

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: TEntity): TResource;

  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: TResponse): TEntity[];
}
