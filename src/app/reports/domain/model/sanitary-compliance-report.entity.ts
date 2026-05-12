export type SanitaryComplianceStatus = 'compliant' | 'observation' | 'insufficient';

export interface SanitaryComplianceFilters {
  assetId: number;
  fromDate: string;
  toDate: string;
}

export interface SanitaryComplianceRow {
  assetId: number;
  assetName: string;
  assetLocation: string;
  totalReadings: number;
  expectedReadings: number;
  validReadings: number;
  outOfRangeCount: number;
  missingReadings: number;
  incidentCount: number;
  averageTemperature: number | null;
  averageHumidity: number | null;
  complianceRate: number;
  status: SanitaryComplianceStatus;
}

export class SanitaryComplianceReport {
  constructor(
    public id: number,
    public organizationId: number,
    public filters: SanitaryComplianceFilters,
    public generatedAt: string,
    public rows: SanitaryComplianceRow[],
  ) {}

  get totalAssets(): number {
    return this.rows.length;
  }

  get totalReadings(): number {
    return this.rows.reduce((total, row) => total + row.totalReadings, 0);
  }

  get expectedReadings(): number {
    return this.rows.reduce((total, row) => total + row.expectedReadings, 0);
  }

  get validReadings(): number {
    return this.rows.reduce((total, row) => total + row.validReadings, 0);
  }

  get missingReadings(): number {
    return this.rows.reduce((total, row) => total + row.missingReadings, 0);
  }

  get outOfRangeCount(): number {
    return this.rows.reduce((total, row) => total + row.outOfRangeCount, 0);
  }

  get incidentCount(): number {
    return this.rows.reduce((total, row) => total + row.incidentCount, 0);
  }

  get observationsCount(): number {
    return this.rows.filter((row) => row.status !== 'compliant').length;
  }

  get complianceRate(): number {
    const denominator = this.expectedReadings || this.totalReadings;

    if (!denominator) {
      return 0;
    }

    return Math.round((this.validReadings / denominator) * 100);
  }

  get canExport(): boolean {
    return this.totalReadings > 0;
  }
}
