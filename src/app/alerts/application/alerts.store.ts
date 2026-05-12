import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Incident, IncidentStatus } from '../domain/model/incident.entity';
import { CorrectiveAction } from '../domain/model/corrective-action.entity';
import { AlertsApi } from '../infrastructure/alerts-api';

@Injectable({ providedIn: 'root' })
export class AlertsStore {
  private readonly incidentsSignal = signal<Incident[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly incidents = this.incidentsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly openIncidents = computed(() =>
    this.incidents().filter((i) => i.status !== IncidentStatus.Resolved)
  );

  constructor(private alertsApi: AlertsApi) {}

  loadIncidents(): void {
    this.loadingSignal.set(true);
    this.alertsApi.getIncidents().subscribe({
      next: (incidents) => {
        this.incidentsSignal.set(incidents);
        this.loadingSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err.message);
        this.loadingSignal.set(false);
      },
    });
  }

  updateIncident(incident: Incident): Observable<Incident> {
    return this.alertsApi.updateIncident(incident).pipe(
      tap((updated) => {
        this.incidentsSignal.update((list) =>
          list.map((i) => (i.id === updated.id ? updated : i))
        );
      })
    );
  }

  resolveIncident(id: number, correctiveAction: CorrectiveAction): Observable<Incident> {
    const incident = this.incidents().find((i) => i.id === id);
    if (!incident) throw new Error('Incident not found');

    const resolvedIncident = new Incident(
      incident.id,
      incident.organizationId,
      incident.assetId,
      incident.type,
      incident.severity,
      IncidentStatus.Resolved,
      incident.detectedAt,
      incident.recognizedAt || new Date().toISOString(),
      new Date().toISOString(),
      correctiveAction
    );

    return this.updateIncident(resolvedIncident);
  }
}
