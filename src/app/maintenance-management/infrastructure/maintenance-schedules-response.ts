import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { MaintenanceScheduleStatus } from '../domain/model/maintenance-schedule-status.enum';

export interface MaintenanceScheduleResource extends BaseResource {
  organizationId: number;
  uuid: string;
  assetId: number;
  iotDeviceId: number | null;
  scheduledDate: string;
  period: string;
  observations: string;
  status: MaintenanceScheduleStatus;
  createdAt: string;
}

export interface MaintenanceSchedulesResponse extends BaseResponse {
  maintenanceSchedules: MaintenanceScheduleResource[];
}
