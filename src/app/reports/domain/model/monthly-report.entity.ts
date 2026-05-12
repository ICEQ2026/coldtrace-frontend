export type MonthlyReportStatus = 'complete' | 'attention' | 'insufficient';

export interface MonthlyReportRow {
  assetId: number;
  assetName: string;
  assetLocation: string;
  totalReadings: number;
  validReadings: number;
  outOfRangeCount: number;
  incidentCount: number;
  averageTemperature: number | null;
  averageHumidity: number | null;
  complianceRate: number;
  firstRecordedAt: string | null;
  lastRecordedAt: string | null;
  status: MonthlyReportStatus;
}

export class MonthlyReport {
  constructor(
    public id: number,
    public organizationId: number,
    public month: string,
    public fromDate: string,
    public toDate: string,
    public generatedAt: string,
    public rows: MonthlyReportRow[],
  ) {}

  get totalAssets(): number {
    return this.rows.length;
  }

  get totalReadings(): number {
    return this.rows.reduce((total, row) => total + row.totalReadings, 0);
  }

  get validReadings(): number {
    return this.rows.reduce((total, row) => total + row.validReadings, 0);
  }

  get outOfRangeCount(): number {
    return this.rows.reduce((total, row) => total + row.outOfRangeCount, 0);
  }

  get incidentCount(): number {
    return this.rows.reduce((total, row) => total + row.incidentCount, 0);
  }

  get attentionAssets(): number {
    return this.rows.filter((row) => row.status !== 'complete').length;
  }

  get complianceRate(): number {
    if (!this.totalReadings) {
      return 0;
    }

    return Math.round((this.validReadings / this.totalReadings) * 100);
  }

  get canDownload(): boolean {
    return this.totalReadings > 0;
  }
}
