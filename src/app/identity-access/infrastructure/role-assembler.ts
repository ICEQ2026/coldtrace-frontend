import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Permission } from '../domain/model/permission.entity';
import { Role } from '../domain/model/role.entity';
import { PermissionResource, RoleResource, RolesResponse } from './roles-response';

/**
 * @summary Maps role data between domain entities and API resources.
 */
export class RoleAssembler implements BaseAssembler<Role, RoleResource, RolesResponse> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: RolesResponse): Role[] {
    return response.roles.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: RoleResource): Role {
    return new Role(
      Number(resource.id),
      resource.name,
      resource.label,
      resource.permissions.map((permission) => this.toPermissionFromResource(permission)),
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: Role): RoleResource {
    return {
      id: entity.id,
      name: entity.name,
      label: entity.label,
      permissions: entity.permissions.map((permission) =>
        this.toPermissionResourceFromEntity(permission),
      ),
    };
  }

  private toPermissionFromResource(resource: PermissionResource): Permission {
    return new Permission(Number(resource.id), resource.resource, resource.action, resource.description);
  }

  private toPermissionResourceFromEntity(entity: Permission): PermissionResource {
    return {
      id: entity.id,
      resource: entity.resource,
      action: entity.action,
      description: entity.description,
    };
  }
}
