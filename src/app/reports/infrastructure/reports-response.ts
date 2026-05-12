import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { ReportType } from '../domain/model/report-type.enum';

export interface ReportResource extends BaseResource {
  organizationId: number;
  uuid: string;
  type: ReportType;
  title: string;
  periodDate: string;
  generatedAt: string;
}

export interface ReportsResponse extends BaseResponse {
  reports: ReportResource[];
}
