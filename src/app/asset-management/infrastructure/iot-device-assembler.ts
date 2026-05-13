import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { IoTDevice } from '../domain/model/iot-device.entity';
import { IoTDeviceResource, IoTDevicesResponse } from './iot-devices-response';

/**
 * @summary Maps IoT device data between domain entities and API resources.
 */
export class IoTDeviceAssembler implements BaseAssembler<
  IoTDevice,
  IoTDeviceResource,
  IoTDevicesResponse
> {
  /**
   * @summary Maps an API response envelope into domain entities.
   */
  toEntitiesFromResponse(response: IoTDevicesResponse): IoTDevice[] {
    return response.iotDevices.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * @summary Maps one API resource into a domain entity.
   */
  toEntityFromResource(resource: IoTDeviceResource): IoTDevice {
    return new IoTDevice(
      Number(resource.id),
      resource.organizationId,
      resource.uuid,
      resource.deviceType,
      resource.model,
      resource.measurementType,
      resource.assetId,
      resource.status,
      resource.calibrationStatus,
      resource.lastCalibrationDate,
      resource.nextCalibrationDate,
      resource.measurementParameters ?? [],
      resource.readingFrequencySeconds ?? 3600,
    );
  }

  /**
   * @summary Maps one domain entity into an API resource.
   */
  toResourceFromEntity(entity: IoTDevice): IoTDeviceResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      deviceType: entity.deviceType,
      model: entity.model,
      measurementType: entity.measurementType,
      measurementParameters: entity.measurementParameters,
      readingFrequencySeconds: entity.readingFrequencySeconds,
      assetId: entity.assetId,
      status: entity.status,
      calibrationStatus: entity.calibrationStatus,
      lastCalibrationDate: entity.lastCalibrationDate,
      nextCalibrationDate: entity.nextCalibrationDate,
    };
  }
}
