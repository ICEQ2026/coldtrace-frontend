import { FindingStatus } from './finding-status.enum';

export type ComplianceFindingType =
  | 'missing-readings'
  | 'out-of-range'
  | 'open-incident'
  | 'expired-calibration'
  | 'incomplete-evaluation';

export type ComplianceFindingSeverity = 'observation' | 'potential-non-compliance' | 'limitation';

export class ComplianceFinding {
  constructor(
    public id: string,
    public organizationId: number,
    public assetId: number,
    public assetName: string,
    public assetLocation: string,
    public type: ComplianceFindingType,
    public severity: ComplianceFindingSeverity,
    public status: FindingStatus,
    public periodFrom: string,
    public periodTo: string,
    public detectedAt: string,
    public evidence: string,
    public messageKey: string,
    public messageParams: Record<string, string | number> = {},
  ) {}
}
