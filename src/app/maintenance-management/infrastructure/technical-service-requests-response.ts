import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { TechnicalServiceStatus } from '../domain/model/technical-service-status.enum';

/**
 * @summary Raw technical service request resource from the ColdTrace API.
 */
export interface TechnicalServiceRequestResource extends BaseResource {
  organizationId: number;
  uuid: string;
  assetId: number;
  priority: string;
  issueDescription: string;
  requestedDate: string;
  status: TechnicalServiceStatus;
  interventionNotes: string | null;
  resultNotes: string | null;
  functionalTestPassed: boolean | null;
  closedAt: string | null;
}

/**
 * @summary Raw response from the ColdTrace API for technical service requests.
 */
export interface TechnicalServiceRequestsResponse extends BaseResponse {
  technicalServiceRequests: TechnicalServiceRequestResource[];
}
