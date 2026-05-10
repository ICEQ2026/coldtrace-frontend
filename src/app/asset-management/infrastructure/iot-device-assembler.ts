import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { IoTDevice } from '../domain/model/iot-device.entity';
import { IoTDeviceResource, IoTDevicesResponse } from './iot-devices-response';

export class IoTDeviceAssembler implements BaseAssembler<IoTDevice, IoTDeviceResource, IoTDevicesResponse> {
  toEntitiesFromResponse(response: IoTDevicesResponse): IoTDevice[] {
    return response.iotDevices.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: IoTDeviceResource): IoTDevice {
    return new IoTDevice(
      resource.id,
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
    );
  }

  toResourceFromEntity(entity: IoTDevice): IoTDeviceResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      uuid: entity.uuid,
      deviceType: entity.deviceType,
      model: entity.model,
      measurementType: entity.measurementType,
      assetId: entity.assetId,
      status: entity.status,
      calibrationStatus: entity.calibrationStatus,
      lastCalibrationDate: entity.lastCalibrationDate,
      nextCalibrationDate: entity.nextCalibrationDate,
    };
  }
}
