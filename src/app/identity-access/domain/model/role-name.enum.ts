/**
 * @summary Defines the allowed role name values used by the identity access bounded context.
 */
export enum RoleName {
  SuperAdministrator = 'super-admin',
  Administrator = 'administrator',
  OperationsManager = 'operations-manager',
  Operator = 'operator',
  Auditor = 'auditor',
}
