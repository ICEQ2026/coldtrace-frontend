import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Gateway } from '../domain/model/gateway.entity';
import { GatewayResource, GatewaysResponse } from './gateways-response';

export class GatewayAssembler implements BaseAssembler<Gateway, GatewayResource, GatewaysResponse> {
  toEntitiesFromResponse(response: GatewaysResponse): Gateway[] {
    return response.gateways.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: GatewayResource): Gateway {
    return new Gateway(
      resource.id,
      resource.organizationId,
      resource.uuid,
      resource.name,
      resource.location,
      resource.network,
      resource.status,
    );
  }

  toResourceFromEntity(entity: Gateway): GatewayResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      name: entity.name,
      location: entity.location,
      network: entity.network,
      status: entity.status,
    };
  }
}
