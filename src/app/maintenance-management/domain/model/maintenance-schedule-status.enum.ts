/**
 * @summary Defines the allowed maintenance schedule status values used by the maintenance management bounded context.
 */
export enum MaintenanceScheduleStatus {
  Scheduled = 'scheduled',
  Pending = 'pending',
  Completed = 'completed',
  Canceled = 'canceled',
}
