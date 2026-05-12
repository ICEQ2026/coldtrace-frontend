import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { SensorReadingsApiEndpoint } from './sensor-readings-api-endpoint';

@Injectable({ providedIn: 'root' })
export class MonitoringApi extends BaseApi {
  private readonly sensorReadingsEndpoint: SensorReadingsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.sensorReadingsEndpoint = new SensorReadingsApiEndpoint(http);
  }

  getSensorReadings(): Observable<SensorReading[]> {
    return this.sensorReadingsEndpoint.getAll();
  }

  createSensorReading(sensorReading: SensorReading): Observable<SensorReading> {
    return this.sensorReadingsEndpoint.create(sensorReading);
  }
}
