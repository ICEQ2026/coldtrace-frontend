import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Incident } from '../domain/model/incident.entity';
import { IncidentResource, IncidentsResponse } from './incident-resource';

export class IncidentAssembler implements BaseAssembler<Incident, IncidentResource, IncidentsResponse> {
  toEntityFromResource(resource: IncidentResource): Incident {
    return new Incident({
      id: Number(resource.id),
      assetId: resource.assetId,
      assetName: resource.assetName,
      type: resource.type,
      severity: resource.severity,
      value: resource.value,
      detectedAt: resource.detectedAt,
      status: resource.status,
      recognizedBy: resource.recognizedBy,
      recognizedAt: resource.recognizedAt,
    });
  }

  toResourceFromEntity(entity: Incident): IncidentResource {
    return {
      id: entity.id,
      assetId: entity.assetId,
      assetName: entity.assetName,
      type: entity.type,
      severity: entity.severity,
      value: entity.value,
      detectedAt: entity.detectedAt,
      status: entity.status,
      recognizedBy: entity.recognizedBy,
      recognizedAt: entity.recognizedAt,
    };
  }

  toEntitiesFromResponse(response: IncidentsResponse): Incident[] {
    return response.incidents.map((resource) => this.toEntityFromResource(resource));
  }
}
