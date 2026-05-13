import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Incident } from '../domain/model/incident.entity';
import { Notification } from '../domain/model/notification.entity';
import { IncidentsApiEndpoint } from './incidents-api-endpoint';
import { NotificationsApiEndpoint } from './notifications-api-endpoint';

/**
 * @summary Groups alerts API operations used by application stores and views.
 */
@Injectable({ providedIn: 'root' })
export class AlertsApi extends BaseApi {
  private readonly incidentsEndpoint: IncidentsApiEndpoint;
  private readonly notificationsEndpoint: NotificationsApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.incidentsEndpoint = new IncidentsApiEndpoint(http);
    this.notificationsEndpoint = new NotificationsApiEndpoint(http);
  }

  /**
   * @summary Fetches incidents from the API endpoint.
   */
  getIncidents(): Observable<Incident[]> {
    return this.incidentsEndpoint.getAll();
  }

  /**
   * @summary Persists an incident through the API endpoint.
   */
  createIncident(incident: Incident): Observable<Incident> {
    return this.incidentsEndpoint.create(incident);
  }

  /**
   * @summary Updates an incident through the API endpoint.
   */
  updateIncident(incident: Incident): Observable<Incident> {
    return this.incidentsEndpoint.update(incident, incident.id);
  }

  /**
   * @summary Fetches notifications from the API endpoint.
   */
  getNotifications(): Observable<Notification[]> {
    return this.notificationsEndpoint.getAll();
  }

  /**
   * @summary Persists a notification through the API endpoint.
   */
  createNotification(notification: Notification): Observable<Notification> {
    return this.notificationsEndpoint.create(notification);
  }
}
