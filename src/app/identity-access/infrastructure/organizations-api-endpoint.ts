import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Organization } from '../domain/model/organization.entity';
import { OrganizationAssembler } from './organization-assembler';
import { OrganizationResource, OrganizationsResponse } from './organizations-response';

/**
 * @summary Connects organizations API endpoint resources to the generic API endpoint contract.
 */
export class OrganizationsApiEndpoint extends BaseApiEndpoint<
  Organization,
  OrganizationResource,
  OrganizationsResponse,
  OrganizationAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderOrganizationsEndpointPath}`,
      new OrganizationAssembler()
    );
  }
}
