import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { SensorReadingResource, SensorReadingsResponse } from './sensor-readings-response';

/**
 * @summary Maps sensor reading data between domain entities and API resources.
 */
export class SensorReadingAssembler implements BaseAssembler<
  SensorReading,
  SensorReadingResource,
  SensorReadingsResponse
> {
  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: SensorReadingResource): SensorReading {
    return new SensorReading(
      Number(resource.id),
      resource.assetId,
      resource.iotDeviceId,
      resource.temperature,
      resource.humidity,
      resource.isOutOfRange,
      resource.recordedAt,
      resource.motionDetected ?? null,
      resource.imageCaptured ?? null,
      resource.batteryLevel ?? null,
      resource.signalStrength ?? null,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: SensorReading): SensorReadingResource {
    return {
      id: entity.id,
      assetId: entity.assetId,
      iotDeviceId: entity.iotDeviceId,
      temperature: entity.temperature,
      humidity: entity.humidity,
      isOutOfRange: entity.isOutOfRange,
      recordedAt: entity.recordedAt,
      motionDetected: entity.motionDetected,
      imageCaptured: entity.imageCaptured,
      batteryLevel: entity.batteryLevel,
      signalStrength: entity.signalStrength,
    };
  }

  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: SensorReadingsResponse): SensorReading[] {
    return response.sensorReadings.map((resource) => this.toEntityFromResource(resource));
  }
}
