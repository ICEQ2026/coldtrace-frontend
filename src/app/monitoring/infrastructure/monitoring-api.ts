import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { SensorReadingsApiEndpoint } from './sensor-readings-api-endpoint';

/**
 * @summary Groups monitoring API operations used by application stores and views.
 */
@Injectable({ providedIn: 'root' })
export class MonitoringApi extends BaseApi {
  private readonly sensorReadingsEndpoint: SensorReadingsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.sensorReadingsEndpoint = new SensorReadingsApiEndpoint(http);
  }

  /**
   * @summary Fetches sensor readings from the API endpoint.
   */
  getSensorReadings(): Observable<SensorReading[]> {
    return this.sensorReadingsEndpoint.getAll();
  }

  /**
   * @summary Persists a sensor reading and appends it to local state.
   */
  createSensorReading(sensorReading: SensorReading): Observable<SensorReading> {
    return this.sensorReadingsEndpoint.create(sensorReading);
  }
}
