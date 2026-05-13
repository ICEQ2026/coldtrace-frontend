/**
 * @summary Defines the allowed technical service status values used by the maintenance management bounded context.
 */
export enum TechnicalServiceStatus {
  Open = 'open',
  PendingReview = 'pending-review',
  Closed = 'closed',
}
