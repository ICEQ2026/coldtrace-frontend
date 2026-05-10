import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Sensor } from '../domain/model/sensor.entity';
import { SensorAssembler } from './sensor-assembler';
import { SensorResource, SensorsResponse } from './sensors-response';

export class SensorsApiEndpoint extends BaseApiEndpoint<
  Sensor,
  SensorResource,
  SensorsResponse,
  SensorAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSensorsEndpointPath}`,
      new SensorAssembler(),
    );
  }
}
