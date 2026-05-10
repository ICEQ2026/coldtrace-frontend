import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Sensor } from '../domain/model/sensor.entity';
import { SensorResource, SensorsResponse } from './sensors-response';

export class SensorAssembler implements BaseAssembler<Sensor, SensorResource, SensorsResponse> {
  toEntitiesFromResponse(response: SensorsResponse): Sensor[] {
    return response.sensors.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: SensorResource): Sensor {
    return new Sensor(
      resource.id,
      resource.organizationId,
      resource.uuid,
      resource.model,
      resource.measurementType,
      resource.assetId,
      resource.gatewayId,
      resource.status,
      resource.calibrationStatus,
      resource.lastCalibrationDate,
      resource.nextCalibrationDate,
    );
  }

  toResourceFromEntity(entity: Sensor): SensorResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      model: entity.model,
      measurementType: entity.measurementType,
      assetId: entity.assetId,
      gatewayId: entity.gatewayId,
      status: entity.status,
      calibrationStatus: entity.calibrationStatus,
      lastCalibrationDate: entity.lastCalibrationDate,
      nextCalibrationDate: entity.nextCalibrationDate,
    };
  }
}
