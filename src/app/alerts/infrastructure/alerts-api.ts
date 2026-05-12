import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Incident } from '../domain/model/incident.entity';
import { IncidentsApiEndpoint } from './incidents-api-endpoint';

@Injectable({ providedIn: 'root' })
export class AlertsApi extends BaseApi {
  private readonly incidentsEndpoint: IncidentsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.incidentsEndpoint = new IncidentsApiEndpoint(http);
  }

  getIncidents(): Observable<Incident[]> {
    return this.incidentsEndpoint.getAll();
  }

  createIncident(incident: Incident): Observable<Incident> {
    return this.incidentsEndpoint.create(incident);
  }

  updateIncident(incident: Incident): Observable<Incident> {
    return this.incidentsEndpoint.update(incident, incident.id);
  }
}
