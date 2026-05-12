import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { TechnicalServiceRequest } from '../domain/model/technical-service-request.entity';
import {
  TechnicalServiceRequestResource,
  TechnicalServiceRequestsResponse,
} from './technical-service-requests-response';

export class TechnicalServiceRequestAssembler implements BaseAssembler<
  TechnicalServiceRequest,
  TechnicalServiceRequestResource,
  TechnicalServiceRequestsResponse
> {
  toEntitiesFromResponse(response: TechnicalServiceRequestsResponse): TechnicalServiceRequest[] {
    return response.technicalServiceRequests.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: TechnicalServiceRequestResource): TechnicalServiceRequest {
    return new TechnicalServiceRequest(
      Number(resource.id),
      resource.organizationId,
      resource.uuid,
      resource.assetId,
      resource.priority,
      resource.issueDescription,
      resource.requestedDate,
      resource.status,
      resource.interventionNotes,
      resource.resultNotes,
      resource.functionalTestPassed,
      resource.closedAt,
    );
  }

  toResourceFromEntity(entity: TechnicalServiceRequest): TechnicalServiceRequestResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      assetId: entity.assetId,
      priority: entity.priority,
      issueDescription: entity.issueDescription,
      requestedDate: entity.requestedDate,
      status: entity.status,
      interventionNotes: entity.interventionNotes,
      resultNotes: entity.resultNotes,
      functionalTestPassed: entity.functionalTestPassed,
      closedAt: entity.closedAt,
    };
  }
}
