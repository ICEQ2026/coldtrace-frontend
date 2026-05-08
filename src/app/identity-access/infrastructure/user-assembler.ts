import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { User } from '../domain/model/user.entity';
import { UserResource, UsersResponse } from './users-response';

export class UserAssembler implements BaseAssembler<User, UserResource, UsersResponse> {
  toEntitiesFromResponse(response: UsersResponse): User[] {
    return response.users.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: UserResource): User {
    return new User(
      resource.id,
      resource.firstName,
      resource.lastName,
      resource.email,
      resource.organizationId,
      resource.roleId,
    );
  }

  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      organizationId: entity.organizationId,
      roleId: entity.roleId,
    };
  }
}
