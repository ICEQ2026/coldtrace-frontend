import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { PermissionAction } from '../domain/model/permission-action.enum';
import { RoleName } from '../domain/model/role-name.enum';

export interface PermissionResource extends BaseResource {
  resource: string;
  action: PermissionAction;
  description: string;
}

export interface RoleResource extends BaseResource {
  name: RoleName;
  label: string;
  permissions: PermissionResource[];
}

export interface RolesResponse extends BaseResponse {
  roles: RoleResource[];
}
