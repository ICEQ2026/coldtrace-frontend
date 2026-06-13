import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
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

  /**
   * @summary Creates readings without a client-side id so JSON Server can avoid duplicate-id races.
   */
  override create(entity: SensorReading): Observable<SensorReading> {
    const { id: _temporaryId, ...resource } = this.assembler.toResourceFromEntity(entity);

    return this.http.post<SensorReadingResource>(this.endpointUrl, resource).pipe(
      map((created) => this.assembler.toEntityFromResource(created)),
      catchError(this.handleError('Failed to create entity')),
    );
  }
}
