import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Incident } from '../domain/model/incident.entity';
import { IncidentAssembler } from './incident-assembler';
import { IncidentResponse } from './incidents-response';

@Injectable({ providedIn: 'root' })
export class AlertsApi {
  private readonly baseUrl = `${environment.platformProviderApiBaseUrl}/incidents`;

  constructor(private http: HttpClient) {}

  getIncidents(): Observable<Incident[]> {
    return this.http
      .get<IncidentResponse[]>(this.baseUrl)
      .pipe(map((responses) => responses.map(IncidentAssembler.toEntity)));
  }

  updateIncident(incident: Incident): Observable<Incident> {
    const response = IncidentAssembler.toResponse(incident);
    return this.http
      .put<IncidentResponse>(`${this.baseUrl}/${incident.id}`, response)
      .pipe(map(IncidentAssembler.toEntity));
  }
}
