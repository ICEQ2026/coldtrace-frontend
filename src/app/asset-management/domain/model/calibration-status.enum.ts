/**
 * @summary Defines the allowed calibration status values used by the asset management bounded context.
 */
export enum CalibrationStatus {
  Compliant = 'compliant',
  DueSoon = 'due-soon',
  Expired = 'expired',
  Unknown = 'unknown',
}
