import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Report } from '../domain/model/report.entity';
import { ReportAssembler } from './report-assembler';
import { ReportResource, ReportsResponse } from './reports-response';

export class ReportsApiEndpoint extends BaseApiEndpoint<
  Report,
  ReportResource,
  ReportsResponse,
  ReportAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderReportsEndpointPath}`,
      new ReportAssembler(),
    );
  }
}
