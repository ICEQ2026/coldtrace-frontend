import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MaintenanceSchedule } from '../domain/model/maintenance-schedule.entity';
import { TechnicalServiceRequest } from '../domain/model/technical-service-request.entity';
import { MaintenanceSchedulesApiEndpoint } from './maintenance-schedules-api-endpoint';
import { TechnicalServiceRequestsApiEndpoint } from './technical-service-requests-api-endpoint';

@Injectable({ providedIn: 'root' })
export class MaintenanceManagementApi extends BaseApi {
  private readonly maintenanceSchedulesEndpoint: MaintenanceSchedulesApiEndpoint;
  private readonly technicalServiceRequestsEndpoint: TechnicalServiceRequestsApiEndpoint;

  constructor(httpClient: HttpClient) {
    super();
    this.maintenanceSchedulesEndpoint = new MaintenanceSchedulesApiEndpoint(httpClient);
    this.technicalServiceRequestsEndpoint = new TechnicalServiceRequestsApiEndpoint(httpClient);
  }

  getMaintenanceSchedules(): Observable<MaintenanceSchedule[]> {
    return this.maintenanceSchedulesEndpoint.getAll();
  }

  createMaintenanceSchedule(
    maintenanceSchedule: MaintenanceSchedule,
  ): Observable<MaintenanceSchedule> {
    return this.maintenanceSchedulesEndpoint.create(maintenanceSchedule);
  }

  updateMaintenanceSchedule(
    maintenanceSchedule: MaintenanceSchedule,
  ): Observable<MaintenanceSchedule> {
    return this.maintenanceSchedulesEndpoint.update(maintenanceSchedule, maintenanceSchedule.id);
  }

  getTechnicalServiceRequests(): Observable<TechnicalServiceRequest[]> {
    return this.technicalServiceRequestsEndpoint.getAll();
  }

  createTechnicalServiceRequest(
    technicalServiceRequest: TechnicalServiceRequest,
  ): Observable<TechnicalServiceRequest> {
    return this.technicalServiceRequestsEndpoint.create(technicalServiceRequest);
  }

  updateTechnicalServiceRequest(
    technicalServiceRequest: TechnicalServiceRequest,
  ): Observable<TechnicalServiceRequest> {
    return this.technicalServiceRequestsEndpoint.update(
      technicalServiceRequest,
      technicalServiceRequest.id,
    );
  }
}
