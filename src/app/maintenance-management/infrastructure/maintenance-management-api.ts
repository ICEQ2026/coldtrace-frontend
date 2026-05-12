import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MaintenanceSchedule } from '../domain/model/maintenance-schedule.entity';
import { MaintenanceSchedulesApiEndpoint } from './maintenance-schedules-api-endpoint';

@Injectable({ providedIn: 'root' })
export class MaintenanceManagementApi extends BaseApi {
  private readonly maintenanceSchedulesEndpoint: MaintenanceSchedulesApiEndpoint;

  constructor(httpClient: HttpClient) {
    super();
    this.maintenanceSchedulesEndpoint = new MaintenanceSchedulesApiEndpoint(httpClient);
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
}
