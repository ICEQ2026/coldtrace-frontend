import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Organization } from '../domain/model/organization.entity';
import { OrganizationResource, OrganizationsResponse } from './organizations-response';

/**
 * @summary Maps organization data between domain entities and API resources.
 */
export class OrganizationAssembler implements BaseAssembler<
  Organization,
  OrganizationResource,
  OrganizationsResponse
> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: OrganizationsResponse): Organization[] {
    return response.organizations.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: OrganizationResource): Organization {
    return new Organization(
      Number(resource.id),
      resource.legalName,
      resource.commercialName,
      resource.taxId,
      resource.contactEmail,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
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
