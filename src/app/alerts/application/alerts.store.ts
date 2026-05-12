import { computed, Injectable, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { AssetSettings } from '../../asset-management/domain/model/asset-settings.entity';
import { Asset } from '../../asset-management/domain/model/asset.entity';
import { AssetManagementApi } from '../../asset-management/infrastructure/asset-management-api';
import { IdentityAccessStore } from '../../identity-access/application/identity-access.store';
import { SensorReading } from '../../monitoring/domain/model/sensor-reading.entity';
import { MonitoringApi } from '../../monitoring/infrastructure/monitoring-api';
import { Incident } from '../domain/model/incident.entity';
import { AlertsApi } from '../infrastructure/alerts-api';

type ThermalConditionKey = 'high-temperature' | 'low-temperature';
type GeneratedConditionKey = ThermalConditionKey | 'thermal-configuration-pending';

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
    private readonly monitoringApi: MonitoringApi,
    private readonly assetManagementApi: AssetManagementApi,
  ) {}

  loadIncidents(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    forkJoin({
      incidents: this.alertsApi.getIncidents(),
      readings: this.monitoringApi.getSensorReadings(),
      assets: this.assetManagementApi.getAssets(),
      settings: this.assetManagementApi.getAssetSettings(),
    })
      .pipe(
        switchMap(({ incidents, readings, assets, settings }) => {
          const generatedIncidents = this.generatedThermalIncidentsFrom(
            incidents,
            readings,
            assets,
            settings,
          );

          if (!generatedIncidents.length) {
            return of(incidents);
          }

          return forkJoin(
            generatedIncidents.map((incident) => this.alertsApi.createIncident(incident)),
          ).pipe(map((createdIncidents) => [...incidents, ...createdIncidents]));
        }),
      )
      .subscribe({
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
      conditionKey: incident.conditionKey,
      source: incident.source,
      sourceReadingId: incident.sourceReadingId,
      reviewStatus: incident.reviewStatus,
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
      conditionKey: incident.conditionKey,
      source: incident.source,
      sourceReadingId: incident.sourceReadingId,
      reviewStatus: incident.reviewStatus,
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
        });
        nextId += 1;
        return incident;
      });
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
