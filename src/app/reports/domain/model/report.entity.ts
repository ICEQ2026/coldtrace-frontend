import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { ReportType } from './report-type.enum';

export class Report implements BaseEntity {
  constructor(
    public id: number,
    public organizationId: number,
    public uuid: string,
    public type: ReportType,
    public title: string,
    public periodDate: string,
    public generatedAt: string,
  ) {}
}
