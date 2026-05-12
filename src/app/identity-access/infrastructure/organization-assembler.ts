import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Organization } from '../domain/model/organization.entity';
import { OrganizationResource, OrganizationsResponse } from './organizations-response';

export class OrganizationAssembler implements BaseAssembler<
  Organization,
  OrganizationResource,
  OrganizationsResponse
> {
  toEntitiesFromResponse(response: OrganizationsResponse): Organization[] {
    return response.organizations.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: OrganizationResource): Organization {
    return new Organization(
      Number(resource.id),
      resource.legalName,
      resource.commercialName,
      resource.taxId,
      resource.contactEmail,
    );
  }

  toResourceFromEntity(entity: Organization): OrganizationResource {
    return {
      id: entity.id,
      legalName: entity.legalName,
      commercialName: entity.commercialName,
      taxId: entity.taxId,
      contactEmail: entity.contactEmail,
    };
  }
}
