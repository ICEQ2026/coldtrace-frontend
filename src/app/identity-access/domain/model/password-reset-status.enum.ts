/**
 * @summary Defines the allowed password reset status values used by the identity access bounded context.
 */
export enum PasswordResetStatus {
  Requested = 'requested',
  Completed = 'completed',
  Expired = 'expired',
}
