import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type DailyLogStatus = 'complete' | 'incomplete' | 'no-data';

export interface DailyLogEntry {
  assetId: number;
  assetName: string;
  assetLocation: string;
  totalReadings: number;
  expectedReadings: number;
  averageTemperature: number | null;
  averageHumidity: number | null;
  outOfRangeCount: number;
  missingReadings: number;
  firstRecordedAt: string | null;
  lastRecordedAt: string | null;
  status: DailyLogStatus;
}

export class DailyLog implements BaseEntity {
  constructor(
    public id: number,
    public organizationId: number,
    public date: string,
    public generatedAt: string,
    public expectedReadings: number,
    public entries: DailyLogEntry[],
  ) {}

  get totalReadings(): number {
    return this.entries.reduce((total, entry) => total + entry.totalReadings, 0);
  }

  get monitoredAssets(): number {
    return this.entries.length;
  }

  get outOfRangeReadings(): number {
    return this.entries.reduce((total, entry) => total + entry.outOfRangeCount, 0);
  }

  get incompleteAssets(): number {
    return this.entries.filter((entry) => entry.status !== 'complete').length;
  }

  get complianceRate(): number {
    if (!this.totalReadings) {
      return 0;
    }

    const validReadings = this.totalReadings - this.outOfRangeReadings;
    return Math.round((validReadings / this.totalReadings) * 100);
  }

  get hasIncompleteData(): boolean {
    return this.incompleteAssets > 0;
  }
}
