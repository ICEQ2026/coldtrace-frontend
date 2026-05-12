import {
  ComplianceFinding,
  ComplianceFindingSeverity,
} from './compliance-finding.entity';
import { FindingStatus } from './finding-status.enum';

export type ComplianceFindingStatusFilter = FindingStatus | 'all';

export interface ComplianceReportFilters {
  assetId: number;
  fromDate: string;
  toDate: string;
  status: ComplianceFindingStatusFilter;
}

export class ComplianceReport {
  constructor(
    public id: number,
    public organizationId: number,
    public filters: ComplianceReportFilters,
    public generatedAt: string,
    public findings: ComplianceFinding[],
  ) {}

  get totalFindings(): number {
    return this.findings.length;
  }

  get openFindings(): number {
    return this.findings.filter((finding) => finding.status === FindingStatus.Open).length;
  }

  get closedFindings(): number {
    return this.findings.filter((finding) => finding.status === FindingStatus.Closed).length;
  }

  get affectedAssets(): number {
    return new Set(this.findings.map((finding) => finding.assetId)).size;
  }

  get potentialNonCompliance(): number {
    return this.countBySeverity('potential-non-compliance');
  }

  get limitations(): number {
    return this.countBySeverity('limitation');
  }

  get hasFindings(): boolean {
    return this.totalFindings > 0;
  }

  private countBySeverity(severity: ComplianceFindingSeverity): number {
    return this.findings.filter((finding) => finding.severity === severity).length;
  }
}
