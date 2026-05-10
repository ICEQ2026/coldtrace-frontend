import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { IoTDevice } from '../domain/model/iot-device.entity';
import { IoTDeviceAssembler } from './iot-device-assembler';
import { IoTDeviceResource, IoTDevicesResponse } from './iot-devices-response';

export class IoTDevicesApiEndpoint extends BaseApiEndpoint<
  IoTDevice,
  IoTDeviceResource,
  IoTDevicesResponse,
  IoTDeviceAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderIoTDevicesEndpointPath}`,
      new IoTDeviceAssembler(),
    );
  }
}
