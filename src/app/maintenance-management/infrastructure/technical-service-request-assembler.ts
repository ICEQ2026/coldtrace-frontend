import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { TechnicalServiceRequest } from '../domain/model/technical-service-request.entity';
import {
  TechnicalServiceRequestResource,
  TechnicalServiceRequestsResponse,
} from './technical-service-requests-response';

/**
 * @summary Maps technical service request data between domain entities and API resources.
 */
export class TechnicalServiceRequestAssembler implements BaseAssembler<
  TechnicalServiceRequest,
  TechnicalServiceRequestResource,
  TechnicalServiceRequestsResponse
> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: TechnicalServiceRequestsResponse): TechnicalServiceRequest[] {
    return response.technicalServiceRequests.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
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

  /**
   * @summary Maps one domain entity into an API resource.
   */
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
