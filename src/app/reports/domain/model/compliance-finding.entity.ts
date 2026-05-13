import { FindingStatus } from './finding-status.enum';

/**
 * @summary Defines the allowed compliance finding type values used by the reports bounded context.
 */
export type ComplianceFindingType =
  | 'missing-readings'
  | 'out-of-range'
  | 'open-incident'
  | 'expired-calibration'
  | 'incomplete-evaluation';

/**
 * @summary Defines the allowed compliance finding severity values used by the reports bounded context.
 */
export type ComplianceFindingSeverity = 'observation' | 'potential-non-compliance' | 'limitation';

/**
 * @summary Represents a compliance finding in the reports bounded context.
 */
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
