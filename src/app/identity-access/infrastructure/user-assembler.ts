import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { UserResource, UsersResponse } from './users-response';

/**
 * @summary Maps user data between domain entities and API resources.
 */
export class UserAssembler implements BaseAssembler<User, UserResource, UsersResponse> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: UsersResponse): User[] {
    return response.users.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: UserResource): User {
    const id = Number(resource.id);
    return new User(
      id,
      resource.firstName,
      resource.lastName,
      resource.email,
      resource.organizationId,
      resource.roleId,
      resource.uuid ?? `USR-${id}`,
      resource.organizationUserId ?? id,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      uuid: entity.uuid,
      organizationUserId: entity.organizationUserId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      organizationId: entity.organizationId,
      roleId: entity.roleId,
    };
  }
}
