import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface OrganizationResource extends BaseResource {
  legalName: string;
  commercialName: string;
  taxId: string;
  contactEmail: string;
}

export interface OrganizationsResponse extends BaseResponse {
  organizations: OrganizationResource[];
}
