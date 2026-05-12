import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { MaintenanceSchedule } from '../domain/model/maintenance-schedule.entity';
import { MaintenanceScheduleAssembler } from './maintenance-schedule-assembler';
import {
  MaintenanceScheduleResource,
  MaintenanceSchedulesResponse,
} from './maintenance-schedules-response';

export class MaintenanceSchedulesApiEndpoint extends BaseApiEndpoint<
  MaintenanceSchedule,
  MaintenanceScheduleResource,
  MaintenanceSchedulesResponse,
  MaintenanceScheduleAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderMaintenanceSchedulesEndpointPath}`,
      new MaintenanceScheduleAssembler(),
    );
  }
}
