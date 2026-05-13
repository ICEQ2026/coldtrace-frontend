import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { PermissionAction } from '../domain/model/permission-action.enum';
import { RoleName } from '../domain/model/role-name.enum';

/**
 * @summary Raw permission resource from the ColdTrace API.
 */
export interface PermissionResource extends BaseResource {
  resource: string;
  action: PermissionAction;
  description: string;
}

/**
 * @summary Raw role resource from the ColdTrace API.
 */
export interface RoleResource extends BaseResource {
  name: RoleName;
  label: string;
  permissions: PermissionResource[];
}

/**
 * @summary Raw response from the ColdTrace API for roles.
 */
export interface RolesResponse extends BaseResponse {
  roles: RoleResource[];
}
