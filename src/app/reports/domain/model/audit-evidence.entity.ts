import { ComplianceFinding } from './compliance-finding.entity';
import { EvidenceItem } from './evidence-item.entity';
import { Report } from './report.entity';

/**
 * @summary Defines the audit evidence filters contract used by the reports bounded context.
 */
export interface AuditEvidenceFilters {
  assetId: number;
  fromDate: string;
  toDate: string;
}

/**
 * @summary Represents audit evidence in the reports bounded context.
 */
export class AuditEvidence {
  constructor(
    public id: number,
    public organizationId: number,
    public filters: AuditEvidenceFilters,
    public generatedAt: string,
    public items: EvidenceItem[],
    public readingsCount: number,
    public expectedReadings: number,
    public incidentCount: number,
    public correctiveActionsCount: number,
    public reports: Report[],
    public findings: ComplianceFinding[],
  ) {}

  get completeItems(): number {
    return this.items.filter((item) => item.isComplete).length;
  }

  get incompleteItems(): number {
    return this.items.length - this.completeItems;
  }

  get completenessRate(): number {
    if (!this.items.length) {
      return 0;
    }

    return Math.round((this.completeItems / this.items.length) * 100);
  }

  get isComplete(): boolean {
    return this.items.length > 0 && this.incompleteItems === 0;
  }

  get hasEvidence(): boolean {
    return this.readingsCount > 0 || this.reports.length > 0 || this.findings.length > 0;
  }
}
