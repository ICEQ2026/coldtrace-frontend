import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { TechnicalServiceRequest } from '../domain/model/technical-service-request.entity';
import { TechnicalServiceRequestAssembler } from './technical-service-request-assembler';
import {
  TechnicalServiceRequestResource,
  TechnicalServiceRequestsResponse,
} from './technical-service-requests-response';

/**
 * @summary Connects technical service requests API endpoint resources to the generic API endpoint contract.
 */
export class TechnicalServiceRequestsApiEndpoint extends BaseApiEndpoint<
  TechnicalServiceRequest,
  TechnicalServiceRequestResource,
  TechnicalServiceRequestsResponse,
  TechnicalServiceRequestAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderTechnicalServiceRequestsEndpointPath}`,
      new TechnicalServiceRequestAssembler(),
    );
  }
}
