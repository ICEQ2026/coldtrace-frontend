import { computed, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IdentityAccessStore } from '../../identity-access/application/identity-access.store';
import { Incident } from '../domain/model/incident.entity';
import { AlertsApi } from '../infrastructure/alerts-api';

@Injectable({ providedIn: 'root' })
export class AlertsStore {
  private readonly incidentsSignal = signal<Incident[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly recognizingIdSignal = signal<number | null>(null);
  private readonly closingIdSignal = signal<number | null>(null);
  private readonly feedbackSignal = signal<string | null>(null);

  readonly incidents = computed(() => {
    const organizationId = this.identityAccessStore.currentOrganizationIdFrom(
      this.identityAccessStore.users(),
    );

    if (!organizationId) {
      return [];
    }

    return this.incidentsSignal().filter(
      (incident) => incident.organizationId === organizationId,
    );
  });
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly recognizingId = this.recognizingIdSignal.asReadonly();
  readonly closingId = this.closingIdSignal.asReadonly();
  readonly feedback = this.feedbackSignal.asReadonly();

  readonly openIncidents = computed(() => this.incidents().filter((i) => i.isOpen));
  readonly openIncidentsCount = computed(() => this.openIncidents().length);

  constructor(
    private readonly alertsApi: AlertsApi,
    private readonly identityAccessStore: IdentityAccessStore,
  ) {}

  loadIncidents(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.alertsApi.getIncidents().subscribe({
      next: (incidents) => {
        this.incidentsSignal.set(incidents);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  recognizeIncident(incident: Incident, responsibleUserName: string): Observable<Incident> {
    const recognized = new Incident({
      id: incident.id,
      organizationId: incident.organizationId,
      assetId: incident.assetId,
      assetName: incident.assetName,
      type: incident.type,
      severity: incident.severity,
      value: incident.value,
      detectedAt: incident.detectedAt,
      status: 'recognized',
      recognizedBy: responsibleUserName,
      recognizedAt: new Date().toISOString(),
      conditionStable: incident.conditionStable,
      correctiveAction: incident.correctiveAction,
      closureEvidence: incident.closureEvidence,
      closedBy: incident.closedBy,
      closedAt: incident.closedAt,
    });

    this.recognizingIdSignal.set(incident.id);
    this.feedbackSignal.set(null);

    return this.alertsApi.updateIncident(recognized).pipe(
      tap({
        next: (updated) => {
          this.incidentsSignal.update((current) =>
            current.map((i) => (i.id === updated.id ? updated : i)),
          );
          this.recognizingIdSignal.set(null);
          this.feedbackSignal.set('alerts.incident-list.feedback-recognized');
        },
        error: () => {
          this.recognizingIdSignal.set(null);
          this.feedbackSignal.set('alerts.incident-list.feedback-error');
        },
      }),
    );
  }

  closeIncident(
    incident: Incident,
    correctiveAction: string,
    closureEvidence: string,
    responsibleUserName: string,
  ): Observable<Incident> {
    const now = new Date().toISOString();
    const closed = new Incident({
      id: incident.id,
      organizationId: incident.organizationId,
      assetId: incident.assetId,
      assetName: incident.assetName,
      type: incident.type,
      severity: incident.severity,
      value: incident.value,
      detectedAt: incident.detectedAt,
      status: 'closed',
      recognizedBy: incident.recognizedBy ?? responsibleUserName,
      recognizedAt: incident.recognizedAt ?? now,
      conditionStable: incident.conditionStable,
      correctiveAction,
      closureEvidence,
      closedBy: responsibleUserName,
      closedAt: now,
    });

    this.closingIdSignal.set(incident.id);
    this.feedbackSignal.set(null);

    return this.alertsApi.updateIncident(closed).pipe(
      tap({
        next: (updated) => {
          this.incidentsSignal.update((current) =>
            current.map((i) => (i.id === updated.id ? updated : i)),
          );
          this.closingIdSignal.set(null);
          this.feedbackSignal.set('alerts.incident-list.feedback-closed');
        },
        error: () => {
          this.closingIdSignal.set(null);
          this.feedbackSignal.set('alerts.incident-list.feedback-error');
        },
      }),
    );
  }

  canResolveAlerts(): boolean {
    const users = this.identityAccessStore.users();
    const roles = this.identityAccessStore.roles();
    const role = this.identityAccessStore.currentRoleFrom(users, roles);
    return this.identityAccessStore
      .permissionKeysForRole(role)
      .includes('roles-permissions.permissions.resolve-alerts');
  }

  clearFeedback(): void {
    this.feedbackSignal.set(null);
  }

  setFeedback(feedback: string | null): void {
    this.feedbackSignal.set(feedback);
  }
}
