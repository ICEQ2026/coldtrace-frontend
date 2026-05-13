import { computed, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, retry, switchMap, tap } from 'rxjs';
import { AssetSettings } from '../../asset-management/domain/model/asset-settings.entity';
import { Asset } from '../../asset-management/domain/model/asset.entity';
import { AssetManagementApi } from '../../asset-management/infrastructure/asset-management-api';
import { IdentityAccessStore } from '../../identity-access/application/identity-access.store';
import { SensorReading } from '../../monitoring/domain/model/sensor-reading.entity';
import { MonitoringApi } from '../../monitoring/infrastructure/monitoring-api';
import { EscalationPolicy } from '../domain/model/escalation-policy.entity';
import { Incident } from '../domain/model/incident.entity';
import { NotificationChannel } from '../domain/model/notification-channel.enum';
import { NotificationStatus } from '../domain/model/notification-status.enum';
import { Notification } from '../domain/model/notification.entity';
import { AlertsApi } from '../infrastructure/alerts-api';

type ThermalConditionKey = 'high-temperature' | 'low-temperature';
type GeneratedConditionKey = ThermalConditionKey | 'thermal-configuration-pending';

/**
 * @summary Manages alerts state and workflows for presentation components.
 */
@Injectable({ providedIn: 'root' })
export class AlertsStore {
  private readonly escalationPolicies = [
    new EscalationPolicy('critical', 30, 2, 'operations-manager'),
    new EscalationPolicy('warning', 720, 1, 'shift-supervisor'),
  ];
  private readonly incidentsSignal = signal<Incident[]>([]);
  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly recognizingIdSignal = signal<number | null>(null);
  private readonly closingIdSignal = signal<number | null>(null);
  private readonly reviewingEscalationIdSignal = signal<number | null>(null);
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
  readonly notifications = computed(() => {
    const organizationId = this.identityAccessStore.currentOrganizationIdFrom(
      this.identityAccessStore.users(),
    );

    if (!organizationId) {
      return [];
    }

    return this.notificationsSignal().filter(
      (notification) => notification.organizationId === organizationId,
    );
  });
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly recognizingId = this.recognizingIdSignal.asReadonly();
  readonly closingId = this.closingIdSignal.asReadonly();
  readonly reviewingEscalationId = this.reviewingEscalationIdSignal.asReadonly();
  readonly feedback = this.feedbackSignal.asReadonly();

  readonly openIncidents = computed(() => this.incidents().filter((i) => i.isOpen));
  readonly openIncidentsCount = computed(() => this.openIncidents().length);
  readonly pendingNotificationsCount = computed(
    () => this.notifications().filter((notification) => notification.isPending).length,
  );
  readonly failedNotificationsCount = computed(
    () => this.notifications().filter((notification) => notification.isFailed).length,
  );
  readonly escalatedIncidentsCount = computed(
    () => this.incidents().filter((incident) => incident.isEscalated).length,
  );
  readonly pendingEscalationConfigurationCount = computed(
    () => this.incidents().filter((incident) => incident.isPendingEscalationConfiguration).length,
  );

  constructor(
    private readonly alertsApi: AlertsApi,
    private readonly identityAccessStore: IdentityAccessStore,
    private readonly monitoringApi: MonitoringApi,
    private readonly assetManagementApi: AssetManagementApi,
  ) {}

  /**
   * @summary Loads incidents data into local state.
   */
  loadIncidents(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({
      incidents: this.alertsApi.getIncidents(),
      notifications: this.alertsApi.getNotifications(),
      readings: this.monitoringApi.getSensorReadings(),
      assets: this.assetManagementApi.getAssets(),
      settings: this.assetManagementApi.getAssetSettings(),
    })
      .pipe(
        switchMap(({ incidents, notifications, readings, assets, settings }) => {
          const generatedIncidents = this.generatedThermalIncidentsFrom(
            incidents,
            readings,
            assets,
            settings,
          );

          const incidentsRequest = generatedIncidents.length
            ? forkJoin(
              generatedIncidents.map((incident) => this.createIncidentWithRetry(incident)),
            ).pipe(map((createdIncidents) => [...incidents, ...createdIncidents]))
            : of(incidents);

          return incidentsRequest.pipe(
            switchMap((currentIncidents) => this.applyEscalationPolicies(currentIncidents)),
            switchMap((currentIncidents) => {
              const generatedNotifications = this.generatedNotificationsFrom(
                currentIncidents,
                notifications,
              );

              if (!generatedNotifications.length) {
                return of({ incidents: currentIncidents, notifications });
              }

              return forkJoin(
                generatedNotifications.map((notification) =>
                  this.createNotificationWithRetry(notification),
                ),
              ).pipe(
                map((createdNotifications) => ({
                  incidents: currentIncidents,
                  notifications: [...notifications, ...createdNotifications],
                })),
              );
            }),
          );
        }),
      )
      .subscribe({
        next: ({ incidents, notifications }) => {
          this.incidentsSignal.set(incidents);
          this.notificationsSignal.set(notifications);
          this.loadingSignal.set(false);
        },
        error: (error) => {
          this.errorSignal.set(error.message);
          this.loadingSignal.set(false);
        },
      });
  }

  /**
   * @summary Marks an incident as recognized by the responsible user.
   */
  recognizeIncident(incident: Incident, responsibleUserName: string): Observable<Incident> {
    const recognized = this.incidentWith(incident, {
      status: 'recognized',
      recognizedBy: responsibleUserName,
      recognizedAt: new Date().toISOString(),
    });

    this.recognizingIdSignal.set(incident.id);
    this.feedbackSignal.set(null);

    return this.updateIncidentWithRetry(recognized).pipe(
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

  /**
   * @summary Closes an incident with corrective action and closure evidence.
   */
  closeIncident(
    incident: Incident,
    correctiveAction: string,
    closureEvidence: string,
    responsibleUserName: string,
  ): Observable<Incident> {
    const now = new Date().toISOString();
    const closed = this.incidentWith(incident, {
      status: 'closed',
      recognizedBy: incident.recognizedBy ?? responsibleUserName,
      recognizedAt: incident.recognizedAt ?? now,
      correctiveAction,
      closureEvidence,
      closedBy: responsibleUserName,
      closedAt: now,
      escalationStatus: incident.isEscalated ? 'reviewed' : incident.escalationStatus,
      escalationReviewedBy: incident.isEscalated
        ? responsibleUserName
        : incident.escalationReviewedBy,
      escalationReviewedAt: incident.isEscalated ? now : incident.escalationReviewedAt,
    });

    this.closingIdSignal.set(incident.id);
    this.feedbackSignal.set(null);

    return this.updateIncidentWithRetry(closed).pipe(
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

  /**
   * @summary Marks an escalated incident as reviewed by the responsible user.
   */
  reviewEscalation(incident: Incident, responsibleUserName: string): Observable<Incident> {
    const reviewed = this.incidentWith(incident, {
      escalationStatus: 'reviewed',
      escalationReviewedBy: responsibleUserName,
      escalationReviewedAt: new Date().toISOString(),
    });

    this.reviewingEscalationIdSignal.set(incident.id);
    this.feedbackSignal.set(null);

    return this.updateIncidentWithRetry(reviewed).pipe(
      tap({
        next: (updated) => {
          this.incidentsSignal.update((current) =>
            current.map((i) => (i.id === updated.id ? updated : i)),
          );
          this.reviewingEscalationIdSignal.set(null);
          this.feedbackSignal.set('alerts.incident-list.feedback-escalation-reviewed');
        },
        error: () => {
          this.reviewingEscalationIdSignal.set(null);
          this.feedbackSignal.set('alerts.incident-list.feedback-error');
        },
      }),
    );
  }

  /**
   * @summary Checks whether the current role can resolve alerts.
   */
  canResolveAlerts(): boolean {
    const users = this.identityAccessStore.users();
    const roles = this.identityAccessStore.roles();
    const role = this.identityAccessStore.currentRoleFrom(users, roles);
    return this.identityAccessStore
      .permissionKeysForRole(role)
      .includes('roles-permissions.permissions.resolve-alerts');
  }

  /**
   * @summary Clears the alert feedback message key.
   */
  clearFeedback(): void {
    this.feedbackSignal.set(null);
  }

  /**
   * @summary Stores the alert feedback message key.
   */
  setFeedback(feedback: string | null): void {
    this.feedbackSignal.set(feedback);
  }

  private incidentWith(
    incident: Incident,
    changes: Partial<ConstructorParameters<typeof Incident>[0]>,
  ): Incident {
    return new Incident({
      id: incident.id,
      organizationId: incident.organizationId,
      assetId: incident.assetId,
      assetName: incident.assetName,
      type: incident.type,
      severity: incident.severity,
      value: incident.value,
      detectedAt: incident.detectedAt,
      status: incident.status,
      recognizedBy: incident.recognizedBy,
      recognizedAt: incident.recognizedAt,
      conditionStable: incident.conditionStable,
      correctiveAction: incident.correctiveAction,
      closureEvidence: incident.closureEvidence,
      closedBy: incident.closedBy,
      closedAt: incident.closedAt,
      conditionKey: incident.conditionKey,
      source: incident.source,
      sourceReadingId: incident.sourceReadingId,
      reviewStatus: incident.reviewStatus,
      escalationStatus: incident.escalationStatus,
      escalationLevel: incident.escalationLevel,
      escalationPolicyMinutes: incident.escalationPolicyMinutes,
      escalatedAt: incident.escalatedAt,
      escalatedTo: incident.escalatedTo,
      escalationReviewedBy: incident.escalationReviewedBy,
      escalationReviewedAt: incident.escalationReviewedAt,
      ...changes,
    });
  }

  private createIncidentWithRetry(incident: Incident): Observable<Incident> {
    return this.alertsApi.createIncident(incident).pipe(retry({ count: 2, delay: 250 }));
  }

  private updateIncidentWithRetry(incident: Incident): Observable<Incident> {
    return this.alertsApi.updateIncident(incident).pipe(retry({ count: 2, delay: 250 }));
  }

  private createNotificationWithRetry(notification: Notification): Observable<Notification> {
    return this.alertsApi.createNotification(notification).pipe(retry({ count: 2, delay: 250 }));
  }

  private applyEscalationPolicies(incidents: Incident[]): Observable<Incident[]> {
    const updates = this.escalationUpdatesFrom(incidents);

    if (!updates.length) {
      return of(incidents);
    }

    return forkJoin(
      updates.map((incident) => this.updateIncidentWithRetry(incident)),
    ).pipe(
      map((updatedIncidents) =>
        incidents.map(
          (incident) =>
            updatedIncidents.find((updated) => updated.id === incident.id) ?? incident,
        ),
      ),
    );
  }

  private escalationUpdatesFrom(incidents: Incident[]): Incident[] {
    const now = new Date();
    const updates: Incident[] = [];

    incidents.forEach((incident) => {
      const updated = this.incidentWithCurrentEscalation(incident, now);

      if (updated && this.hasEscalationChanges(incident, updated)) {
        updates.push(updated);
      }
    });

    return updates;
  }

  private incidentWithCurrentEscalation(incident: Incident, now: Date): Incident | null {
    if (incident.isClosed || incident.escalationStatus === 'reviewed') {
      return null;
    }

    if (!incident.isOpen) {
      return incident.escalationStatus === 'pending-configuration'
        ? this.incidentWith(incident, {
          escalationStatus: 'none',
          escalationLevel: 0,
          escalationPolicyMinutes: this.escalationPolicyFor(incident)?.waitingMinutes ?? null,
          escalatedAt: null,
          escalatedTo: null,
        })
        : null;
    }

    const policy = this.escalationPolicyFor(incident);

    if (!policy) {
      return this.incidentWith(incident, {
        escalationStatus: 'pending-configuration',
        escalationLevel: 0,
        escalationPolicyMinutes: null,
        escalatedAt: null,
        escalatedTo: null,
      });
    }

    if (!this.hasExceededEscalationThreshold(incident, policy, now)) {
      return this.incidentWith(incident, {
        escalationStatus: 'none',
        escalationLevel: 0,
        escalationPolicyMinutes: policy.waitingMinutes,
        escalatedAt: null,
        escalatedTo: null,
      });
    }

    return this.incidentWith(incident, {
      escalationStatus: 'escalated',
      escalationLevel: policy.level,
      escalationPolicyMinutes: policy.waitingMinutes,
      escalatedAt: incident.escalatedAt ?? now.toISOString(),
      escalatedTo: policy.targetKey,
    });
  }

  private escalationPolicyFor(incident: Incident): EscalationPolicy | undefined {
    return this.escalationPolicies.find((policy) => policy.appliesTo(incident));
  }

  private hasExceededEscalationThreshold(
    incident: Incident,
    policy: EscalationPolicy,
    now: Date,
  ): boolean {
    const detectedAt = new Date(incident.detectedAt);

    if (Number.isNaN(detectedAt.getTime())) {
      return false;
    }

    const elapsedMinutes = (now.getTime() - detectedAt.getTime()) / 60000;
    return elapsedMinutes >= policy.waitingMinutes;
  }

  private hasEscalationChanges(current: Incident, updated: Incident): boolean {
    return (
      current.escalationStatus !== updated.escalationStatus ||
      current.escalationLevel !== updated.escalationLevel ||
      current.escalationPolicyMinutes !== updated.escalationPolicyMinutes ||
      current.escalatedAt !== updated.escalatedAt ||
      current.escalatedTo !== updated.escalatedTo ||
      current.escalationReviewedBy !== updated.escalationReviewedBy ||
      current.escalationReviewedAt !== updated.escalationReviewedAt
    );
  }

  private generatedThermalIncidentsFrom(
    incidents: Incident[],
    readings: SensorReading[],
    assets: Asset[],
    settings: AssetSettings[],
  ): Incident[] {
    const candidates = [
      ...this.latestThermalCandidates(readings, assets, settings),
      ...this.pendingReviewCandidates(readings, assets, settings),
    ];
    let nextId = Math.max(...incidents.map((incident) => incident.id), 0) + 1;
    const now = new Date();

    return candidates
      .filter((candidate) => {
        return !this.hasActiveEquivalentIncident(
          incidents,
          candidate.asset.id,
          candidate.conditionKey,
          settings,
        );
      })
      .map((candidate) => {
        const incident = new Incident({
          id: nextId,
          organizationId: candidate.asset.organizationId,
          assetId: candidate.asset.id,
          assetName: candidate.asset.name,
          type: candidate.type,
          severity: candidate.severity,
          value: candidate.value,
          detectedAt: candidate.reading.recordedAt,
          status: 'open',
          recognizedBy: null,
          recognizedAt: null,
          conditionStable: false,
          correctiveAction: null,
          closureEvidence: null,
          closedBy: null,
          closedAt: null,
          conditionKey: candidate.conditionKey,
          source: 'sensor-reading',
          sourceReadingId: candidate.reading.id,
          reviewStatus: candidate.reviewStatus,
          escalationStatus: 'none',
          escalationLevel: 0,
          escalationPolicyMinutes: null,
          escalatedAt: null,
          escalatedTo: null,
          escalationReviewedBy: null,
          escalationReviewedAt: null,
        });
        nextId += 1;
        return this.incidentWithCurrentEscalation(incident, now) ?? incident;
      });
  }

  private generatedNotificationsFrom(
    incidents: Incident[],
    notifications: Notification[],
  ): Notification[] {
    const notificationChannels = [
      NotificationChannel.App,
      NotificationChannel.Email,
      NotificationChannel.Sms,
    ];
    let nextId = Math.max(...notifications.map((notification) => notification.id), 0) + 1;

    return incidents
      .filter((incident) => incident.severity === 'critical' && !incident.isClosed)
      .flatMap((incident) =>
        notificationChannels
          .filter(
            (channel) =>
              !notifications.some(
                (notification) =>
                  notification.incidentId === incident.id &&
                  notification.channel === channel,
              ),
          )
          .map((channel) => {
            const notification = this.notificationForIncident(incident, channel, nextId);
            nextId += 1;
            return notification;
          }),
      );
  }

  private notificationForIncident(
    incident: Incident,
    channel: NotificationChannel,
    id: number,
  ): Notification {
    const status = this.notificationStatusFor(channel);
    const createdAt = new Date(incident.detectedAt).toISOString();

    return new Notification(
      id,
      incident.organizationId,
      incident.id,
      incident.assetName,
      channel,
      this.notificationRecipientFor(channel),
      `${incident.assetName} reported ${incident.value} and requires attention.`,
      status,
      createdAt,
      status === NotificationStatus.Sent ? this.plusMinutes(createdAt, 2) : null,
      status === NotificationStatus.Failed
        ? 'Recipient phone is not configured for SMS alerts.'
        : null,
    );
  }

  private notificationStatusFor(channel: NotificationChannel): NotificationStatus {
    switch (channel) {
      case NotificationChannel.App:
        return NotificationStatus.Sent;
      case NotificationChannel.Email:
        return NotificationStatus.Pending;
      default:
        return NotificationStatus.Failed;
    }
  }

  private notificationRecipientFor(channel: NotificationChannel): string {
    const currentUser = this.identityAccessStore.currentUserFrom(this.identityAccessStore.users());

    switch (channel) {
      case NotificationChannel.Email:
        return currentUser?.email ?? 'operations@coldtrace.local';
      case NotificationChannel.Sms:
        return 'No phone configured';
      default:
        return this.identityAccessStore.currentUserNameFrom(this.identityAccessStore.users());
    }
  }

  private plusMinutes(isoDate: string, minutes: number): string {
    const date = new Date(isoDate);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
  }

  private latestThermalCandidates(
    readings: SensorReading[],
    assets: Asset[],
    settings: AssetSettings[],
  ): {
    reading: SensorReading;
    asset: Asset;
    type: 'temperature';
    conditionKey: ThermalConditionKey;
    severity: 'warning' | 'critical';
    value: string;
    reviewStatus: 'complete';
  }[] {
    const latestByAsset = new Map<number, { reading: SensorReading; asset: Asset }>();

    readings
      .filter((reading) => reading.temperature !== null)
      .forEach((reading) => {
        const asset = assets.find((currentAsset) => currentAsset.id === reading.assetId);

        if (!asset) {
          return;
        }

        const previous = latestByAsset.get(asset.id);

        if (!previous || this.isNewerReading(reading, previous.reading)) {
          latestByAsset.set(asset.id, { reading, asset });
        }
      });

    return [...latestByAsset.values()]
      .map(({ reading, asset }) => {
        const assetSettings = this.settingsForAsset(asset, settings);

        if (!assetSettings || reading.temperature === null) {
          return null;
        }

        const conditionKey = this.temperatureConditionKey(reading.temperature, assetSettings);

        if (!conditionKey) {
          return null;
        }

        return {
          reading,
          asset,
          type: 'temperature' as const,
          conditionKey,
          severity: this.thermalSeverity(reading.temperature, assetSettings),
          value: `${reading.temperature}${assetSettings.temperatureUnit}`,
          reviewStatus: 'complete' as const,
        };
      })
      .filter((candidate): candidate is {
        reading: SensorReading;
        asset: Asset;
        type: 'temperature';
        conditionKey: ThermalConditionKey;
        severity: 'warning' | 'critical';
        value: string;
        reviewStatus: 'complete';
      } => candidate !== null)
      .sort((a, b) => b.reading.recordedAt.localeCompare(a.reading.recordedAt));
  }

  private pendingReviewCandidates(
    readings: SensorReading[],
    assets: Asset[],
    settings: AssetSettings[],
  ): {
    reading: SensorReading;
    asset: Asset;
    type: 'other';
    conditionKey: 'thermal-configuration-pending';
    severity: 'warning';
    value: string;
    reviewStatus: 'pending-review';
  }[] {
    const latestByAsset = new Map<number, { reading: SensorReading; asset: Asset }>();

    readings
      .filter((reading) => reading.isOutOfRange && reading.temperature !== null)
      .forEach((reading) => {
        const asset = assets.find((currentAsset) => currentAsset.id === reading.assetId);

        if (!asset || this.settingsForAsset(asset, settings)) {
          return;
        }

        const previous = latestByAsset.get(asset.id);

        if (!previous || this.isNewerReading(reading, previous.reading)) {
          latestByAsset.set(asset.id, { reading, asset });
        }
      });

    return [...latestByAsset.values()].map(({ reading, asset }) => ({
      reading,
      asset,
      type: 'other',
      conditionKey: 'thermal-configuration-pending',
      severity: 'warning',
      value: 'Pending thermal range',
      reviewStatus: 'pending-review',
    }));
  }

  private hasActiveEquivalentIncident(
    incidents: Incident[],
    assetId: number,
    conditionKey: GeneratedConditionKey,
    settings: AssetSettings[],
  ): boolean {
    return incidents.some((incident) => {
      if (incident.isClosed || incident.assetId !== assetId) {
        return false;
      }

      return this.conditionKeyForIncident(incident, settings) === conditionKey;
    });
  }

  private conditionKeyForIncident(
    incident: Incident,
    settings: AssetSettings[],
  ): string | null {
    if (incident.conditionKey) {
      return incident.conditionKey;
    }

    if (incident.type !== 'temperature') {
      return null;
    }

    const value = Number(incident.value.replace(/[^\d.-]/g, ''));
    const assetSettings = settings.find((setting) => setting.assetId === incident.assetId);

    if (!assetSettings || Number.isNaN(value)) {
      return 'temperature';
    }

    return this.temperatureConditionKey(value, assetSettings);
  }

  private settingsForAsset(asset: Asset, settings: AssetSettings[]): AssetSettings | undefined {
    return (
      settings.find((setting) => setting.assetId === asset.id) ??
      settings.find(
        (setting) =>
          setting.organizationId === asset.organizationId && setting.assetId === null,
      )
    );
  }

  private temperatureConditionKey(
    temperature: number,
    settings: AssetSettings,
  ): ThermalConditionKey | null {
    if (temperature > settings.maximumTemperature) {
      return 'high-temperature';
    }

    if (temperature < settings.minimumTemperature) {
      return 'low-temperature';
    }

    return null;
  }

  private thermalSeverity(
    temperature: number,
    settings: AssetSettings,
  ): 'warning' | 'critical' {
    const upperDelta = temperature - settings.maximumTemperature;
    const lowerDelta = settings.minimumTemperature - temperature;
    const deviation = Math.max(upperDelta, lowerDelta);

    return deviation >= 2 ? 'critical' : 'warning';
  }

  private isNewerReading(current: SensorReading, previous: SensorReading): boolean {
    return new Date(current.recordedAt).getTime() > new Date(previous.recordedAt).getTime();
  }
}
