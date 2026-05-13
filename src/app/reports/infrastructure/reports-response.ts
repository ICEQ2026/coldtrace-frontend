import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { ReportType } from '../domain/model/report-type.enum';

/**
 * @summary Raw report resource from the ColdTrace API.
 */
export interface ReportResource extends BaseResource {
  organizationId: number;
  uuid: string;
  type: ReportType;
  title: string;
  periodDate: string;
  generatedAt: string;
}

/**
 * @summary Raw response from the ColdTrace API for reports.
 */
export interface ReportsResponse extends BaseResponse {
  reports: ReportResource[];
}
