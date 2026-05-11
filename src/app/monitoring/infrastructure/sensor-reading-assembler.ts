import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { SensorReadingResource, SensorReadingsResponse } from './sensor-readings-response';

export class SensorReadingAssembler implements BaseAssembler<SensorReading, SensorReadingResource, SensorReadingsResponse> {
  toEntityFromResource(resource: SensorReadingResource): SensorReading {
    return new SensorReading(
      resource.id,
      resource.assetId,
      resource.iotDeviceId,
      resource.temperature,
      resource.humidity,
      resource.isOutOfRange,
      resource.recordedAt,
    );
  }

  toResourceFromEntity(entity: SensorReading): SensorReadingResource {
    return {
      id: entity.id,
      assetId: entity.assetId,
      iotDeviceId: entity.iotDeviceId,
      temperature: entity.temperature,
      humidity: entity.humidity,
      isOutOfRange: entity.isOutOfRange,
      recordedAt: entity.recordedAt,
    };
  }

  toEntitiesFromResponse(response: SensorReadingsResponse): SensorReading[] {
    return response.sensorReadings.map(resource => this.toEntityFromResource(resource));
  }
}
