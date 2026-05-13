/**
 * @summary Defines the allowed evidence item type values used by the reports bounded context.
 */
export type EvidenceItemType =
  | 'monitoring-readings'
  | 'generated-reports'
  | 'compliance-findings'
  | 'incident-records'
  | 'corrective-actions';

/**
 * @summary Defines the allowed evidence item status values used by the reports bounded context.
 */
export type EvidenceItemStatus = 'complete' | 'incomplete';

/**
 * @summary Represents an evidence item in the reports bounded context.
 */
export class EvidenceItem {
  constructor(
    public id: EvidenceItemType,
    public status: EvidenceItemStatus,
    public quantity: number,
    public requiredQuantity: number,
    public messageKey: string,
    public messageParams: Record<string, string | number> = {},
  ) {}

  get isComplete(): boolean {
    return this.status === 'complete';
  }
}
