/**
 * @summary Defines the allowed permission action values used by the identity access bounded context.
 */
export enum PermissionAction {
  View = 'view',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  Manage = 'manage',
}
