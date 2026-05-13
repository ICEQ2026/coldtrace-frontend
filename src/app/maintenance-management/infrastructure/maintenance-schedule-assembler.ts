import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { MaintenanceSchedule } from '../domain/model/maintenance-schedule.entity';
import {
  MaintenanceScheduleResource,
  MaintenanceSchedulesResponse,
} from './maintenance-schedules-response';

/**
 * @summary Maps maintenance schedule data between domain entities and API resources.
 */
export class MaintenanceScheduleAssembler implements BaseAssembler<
  MaintenanceSchedule,
  MaintenanceScheduleResource,
  MaintenanceSchedulesResponse
> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: MaintenanceSchedulesResponse): MaintenanceSchedule[] {
    return response.maintenanceSchedules.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: MaintenanceScheduleResource): MaintenanceSchedule {
    return new MaintenanceSchedule(
      Number(resource.id),
      resource.organizationId,
      resource.uuid,
      resource.assetId,
      resource.iotDeviceId,
      resource.scheduledDate,
      resource.period,
      resource.observations,
      resource.status,
      resource.createdAt,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: MaintenanceSchedule): MaintenanceScheduleResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      assetId: entity.assetId,
      iotDeviceId: entity.iotDeviceId,
      scheduledDate: entity.scheduledDate,
      period: entity.period,
      observations: entity.observations,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}
