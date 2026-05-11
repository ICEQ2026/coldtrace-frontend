import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { OperationalDashboardData } from '../domain/model/operational-dashboard-data.entity';
import { OperationalDashboardAssembler } from './operational-dashboard-assembler';
import { OperationalDashboardResource, OperationalDashboardsResponse } from './operational-dashboards-response';

export class OperationalDashboardsApiEndpoint extends BaseApiEndpoint<OperationalDashboardData, OperationalDashboardResource, OperationalDashboardsResponse, OperationalDashboardAssembler> {
  constructor(http: HttpClient) {
    super(http, environment.platformProviderApiBaseUrl + environment.platformProviderOperationalDashboardsEndpointPath, new OperationalDashboardAssembler());
  }
}
