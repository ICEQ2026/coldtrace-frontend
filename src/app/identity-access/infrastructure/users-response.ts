import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface UserResource extends BaseResource {
  firstName: string;
  lastName: string;
  email: string;
  organizationId: number;
  roleId: number;
}

export interface UsersResponse extends BaseResponse {
  users: UserResource[];
}
