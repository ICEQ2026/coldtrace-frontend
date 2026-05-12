export type EvidenceItemType =
  | 'monitoring-readings'
  | 'generated-reports'
  | 'compliance-findings'
  | 'incident-records'
  | 'corrective-actions';

export type EvidenceItemStatus = 'complete' | 'incomplete';

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
