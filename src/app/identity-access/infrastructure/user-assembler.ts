import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { UserResource, UsersResponse } from './users-response';

export class UserAssembler implements BaseAssembler<User, UserResource, UsersResponse> {
  toEntitiesFromResponse(response: UsersResponse): User[] {
    return response.users.map((resource) => this.toEntityFromResource(resource));
  }

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
