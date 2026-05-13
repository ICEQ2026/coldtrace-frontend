import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { SensorReadingAssembler } from './sensor-reading-assembler';
import { SensorReadingResource, SensorReadingsResponse } from './sensor-readings-response';

/**
 * @summary Connects sensor readings API endpoint resources to the generic API endpoint contract.
 */
export class SensorReadingsApiEndpoint extends BaseApiEndpoint<SensorReading, SensorReadingResource, SensorReadingsResponse, SensorReadingAssembler> {
  constructor(http: HttpClient) {
    super(http, environment.platformProviderApiBaseUrl + environment.platformProviderSensorReadingsEndpointPath, new SensorReadingAssembler());
  }
}
