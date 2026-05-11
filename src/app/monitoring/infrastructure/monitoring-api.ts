import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { OperationalDashboardData } from '../domain/model/operational-dashboard-data.entity';
import { SensorReading } from '../domain/model/sensor-reading.entity';
import { OperationalDashboardsApiEndpoint } from './operational-dashboards-api-endpoint';
import { SensorReadingsApiEndpoint } from './sensor-readings-api-endpoint';

@Injectable({ providedIn: 'root' })
export class MonitoringApi extends BaseApi {
  private readonly sensorReadingsEndpoint: SensorReadingsApiEndpoint;
  private readonly operationalDashboardsEndpoint: OperationalDashboardsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.sensorReadingsEndpoint = new SensorReadingsApiEndpoint(http);
    this.operationalDashboardsEndpoint = new OperationalDashboardsApiEndpoint(http);
  }

  getSensorReadings(): Observable<SensorReading[]> {
    return this.sensorReadingsEndpoint.getAll();
  }

  getOperationalDashboards(): Observable<OperationalDashboardData[]> {
    return this.operationalDashboardsEndpoint.getAll();
  }
}
