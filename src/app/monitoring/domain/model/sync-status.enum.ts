/**
 * @summary Defines the allowed sync status values used by the monitoring bounded context.
 */
export enum SyncStatus {
  Pending = 'Pending',
  Synced = 'Synced',
  Failed = 'Failed',
}
