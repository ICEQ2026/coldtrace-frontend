import { Component, DestroyRef, computed, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { interval } from 'rxjs';

import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';
import { AssetStatus } from '../../../../asset-management/domain/model/asset-status.enum';
import { CalibrationStatus } from '../../../../asset-management/domain/model/calibration-status.enum';
import { ConnectivityStatus } from '../../../../asset-management/domain/model/connectivity-status.enum';
import { GatewayStatus } from '../../../../asset-management/domain/model/gateway-status.enum';
import { IoTDeviceStatus } from '../../../../asset-management/domain/model/iot-device-status.enum';
import { AssetSettings } from '../../../../asset-management/domain/model/asset-settings.entity';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { TELEMETRY_POLLING_INTERVAL_MS } from '../../../../shared/domain/model/polling-interval.constant';
import { MonitoringStore } from '../../../application/monitoring.store';
import { IncidentDay } from '../../../domain/model/incident-day.entity';
import { MaintenanceTask } from '../../../domain/model/maintenance-task.entity';
import { RecentAlert } from '../../../domain/model/recent-alert.entity';
import { SensorReading } from '../../../domain/model/sensor-reading.entity';
import { StorageDistributionItem } from '../../../domain/model/storage-distribution-item.entity';
import { TemperaturePoint } from '../../../domain/model/temperature-point.entity';
import { IncidentsChart } from '../../components/incidents-chart/incidents-chart';
import { MaintenanceList } from '../../components/maintenance-list/maintenance-list';
import { RecentAlerts } from '../../components/recent-alerts/recent-alerts';
import { DashboardKpi } from '../../components/stat-card/dashboard-kpi';
import { StatCard } from '../../components/stat-card/stat-card';
import { StorageDistribution } from '../../components/storage-distribution/storage-distribution';
import { TemperatureChart } from '../../components/temperature-chart/temperature-chart';

@Component({
  selector: 'app-operational-dashboard',
  standalone: true,
  imports: [
    TranslateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatCard,
    TemperatureChart,
    StorageDistribution,
    MaintenanceList,
    RecentAlerts,
    IncidentsChart,
  ],
  templateUrl: './operational-dashboard.html',
  styleUrl: './operational-dashboard.css',
})
export class OperationalDashboard implements OnInit {
  protected readonly monitoringStore = inject(MonitoringStore);
  protected readonly assetStore = inject(AssetManagementStore);
  protected readonly identityStore = inject(IdentityAccessStore);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activeOrganizationId = computed(() => {
    return this.identityStore.currentOrganizationIdFrom(this.identityStore.users());
  });
  protected readonly organizationAssets = computed(() => {
    return this.assetStore.assetsForOrganization(this.activeOrganizationId());
  });
  protected readonly organizationAssetIds = computed(() => {
    return this.organizationAssets().map((asset) => asset.id);
  });
  protected readonly organizationIoTDevices = computed(() => {
    return this.assetStore.iotDevicesForOrganization(this.activeOrganizationId());
  });
  protected readonly organizationGateways = computed(() => {
    return this.assetStore.gatewaysForOrganization(this.activeOrganizationId());
  });
  protected readonly organizationReadings = computed(() => {
    const since = new Date();
    since.setHours(since.getHours() - 24);
    return this.monitoringStore.readingsForAssetIdsSince(this.organizationAssetIds(), since);
  });
  protected readonly assetSummary = computed(() => {
    return this.assetStore.operationalSummaryFor(this.activeOrganizationId());
  });
  protected readonly currentSettings = computed(() => {
    return (
      this.assetStore
        .assetSettings()
        .find((assetSettings) => assetSettings.organizationId === this.activeOrganizationId()) ??
      null
    );
  });
  protected readonly monitoredAssetsKpi = computed(() => this.buildMonitoredAssetsKpi());
  protected readonly criticalAlertsKpi = computed(() => this.buildCriticalAlertsKpi());
  protected readonly activeSensorsKpi = computed(() => this.buildActiveSensorsKpi());
  protected readonly incidentsKpi = computed(() => this.buildIncidentsKpi());
  protected readonly thermalComplianceKpi = computed(() => this.buildThermalComplianceKpi());
  protected readonly temperaturePoints = computed(() => this.buildTemperaturePoints());
  protected readonly storageDistribution = computed(() => this.buildStorageDistribution());
  protected readonly maintenanceTasks = computed(() => this.buildMaintenanceTasks());
  protected readonly recentAlerts = computed(() => this.buildRecentAlerts());
  protected readonly incidentDays = computed(() => this.buildIncidentDays());
  protected readonly timeline = computed(() => this.buildTimeline());
  protected readonly maintenanceCompletionRate = computed(() => {
    const summary = this.assetSummary();

    if (!summary.totalDevices) {
      return 0;
    }

    return Math.round((summary.connectedDevices / summary.totalDevices) * 100);
  });
  protected readonly activeOrganizationName = computed(() => {
    return this.identityStore.currentOrganizationNameFrom(
      this.identityStore.users(),
      this.identityStore.organizations(),
    );
  });
  protected readonly profileUserName = computed(() => {
    return this.identityStore.currentUserNameFrom(this.identityStore.users());
  });
  protected readonly profileRoleLabelKey = computed(() => {
    return this.identityStore.currentRoleLabelKeyFrom(
      this.identityStore.users(),
      this.identityStore.roles(),
    );
  });
  protected readonly canManageAccessValue = computed(() => {
    return this.identityStore.canManageAccess(
      this.identityStore.users(),
      this.identityStore.roles(),
    );
  });
  protected readonly identityLoading = computed(() => this.identityStore.loading());
  protected readonly assetIssueCount = computed(() => this.assetSummary().assetsWithIssues);
  protected readonly openAlertsCount = computed(() => this.recentAlerts().length);
  protected readonly hasOperationalData = computed(() => {
    return (
      this.assetSummary().totalAssets > 0 ||
      this.organizationIoTDevices().length > 0 ||
      this.organizationGateways().length > 0 ||
      this.organizationReadings().length > 0
    );
  });

  ngOnInit(): void {
    this.identityStore.loadUsers();
    this.identityStore.loadOrganizations();
    this.identityStore.loadRoles();
    this.assetStore.loadAssets();
    this.assetStore.loadIoTDevices();
    this.assetStore.loadGateways();
    this.assetStore.loadAssetSettings();
    this.monitoringStore.loadReadings();
    this.startReadingsUpdates();
  }

  protected logout(): void {
    this.identityStore.clearCurrentUser();
    void this.router.navigate(['/identity-access/sign-in']);
  }

  private startReadingsUpdates(): void {
    interval(TELEMETRY_POLLING_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.monitoringStore.updateOrganizationTelemetry(this.activeOrganizationId());
      });
  }

  private buildMonitoredAssetsKpi(): DashboardKpi {
    const summary = this.assetSummary();

    return this.kpi({
      id: 1,
      key: 'monitored-assets',
      title: 'monitoring.operational.metric-monitored',
      value: `${summary.monitoredAssets}`,
      valueUnit: 'monitoring.operational.unit-assets',
      size: 'large',
      color: {
        bg: '#3B66F5',
        border: '#3B66F5',
        text: '#FFFFFF',
        chart: 'rgba(255,255,255,0.7)',
      },
      tooltip: {
        text: 'monitoring.operational.label-monitored',
        position: 82,
      },
      chartData: this.buildSummaryBars(
        [
          summary.totalAssets,
          summary.monitoredAssets,
          summary.connectedDevices,
          summary.connectedGateways,
          summary.assetsWithIssues,
          this.organizationReadings().length,
        ],
        13,
      ),
      highlightedBar: 10,
      showAnchor: false,
    });
  }

  private buildCriticalAlertsKpi(): DashboardKpi {
    return this.kpi({
      id: 2,
      key: 'critical-alerts',
      title: 'monitoring.operational.metric-critical-alerts',
      value: `${this.openAlertsCount()}`,
      valueUnit: 'monitoring.operational.label-active',
      size: 'large',
      type: 'wave',
      color: {
        bg: '#8B31E3',
        border: '#8B31E3',
        text: '#FFFFFF',
        chart: 'rgba(255,255,255,0.8)',
      },
      tooltip: {
        text: 'monitoring.operational.label-open',
        position: 52,
      },
      chartData: [],
      highlightedBar: -1,
      showAnchor: true,
    });
  }

  private buildActiveSensorsKpi(): DashboardKpi {
    const summary = this.assetSummary();
    const linkedDevices = this.organizationIoTDevices().filter(
      (iotDevice) => iotDevice.status === IoTDeviceStatus.Linked,
    ).length;
    const availableDevices = this.organizationIoTDevices().filter(
      (iotDevice) => iotDevice.status === IoTDeviceStatus.Available,
    ).length;
    const offlineDevices = this.organizationIoTDevices().filter(
      (iotDevice) => iotDevice.status === IoTDeviceStatus.Offline,
    ).length;

    return this.kpi({
      id: 3,
      key: 'active-sensors',
      title: 'monitoring.operational.metric-sensors',
      value: `${summary.connectedDevices}`,
      valueUnit: 'monitoring.operational.unit-devices',
      size: 'small',
      color: {
        bg: '#D8F0FF',
        border: '#D8F0FF',
        text: '#3B66F5',
        chart: '#3B66F5',
      },
      tooltip: {
        text: 'monitoring.operational.label-linked',
        position: 82,
      },
      chartData: this.buildStatusBars([
        linkedDevices,
        availableDevices,
        offlineDevices,
        summary.connectedGateways,
      ]),
      highlightedBar: 8,
      showAnchor: false,
    });
  }

  private buildIncidentsKpi(): DashboardKpi {
    const count = this.openAlertsCount();

    return this.kpi({
      id: 4,
      key: 'incidents',
      title: 'monitoring.operational.metric-incidents',
      value: `${count}`,
      valueUnit: 'monitoring.operational.label-open',
      size: 'small',
      color: {
        bg: '#F2E6FF',
        border: '#F2E6FF',
        text: '#8B31E3',
        chart: '#8B31E3',
      },
      tooltip: {
        text: 'monitoring.operational.label-recent',
        position: 78,
      },
      chartData: this.buildStatusBars([
        count,
        this.assetSummary().connectivityIssues,
        this.monitoringStore.outOfRangeCountForAssetIds(this.organizationAssetIds()),
      ]),
      highlightedBar: 5,
      showAnchor: false,
    });
  }

  private buildThermalComplianceKpi(): DashboardKpi {
    const compliance = this.monitoringStore.thermalComplianceForAssetIds(
      this.organizationAssetIds(),
    );

    return this.kpi({
      id: 5,
      key: 'thermal-compliance',
      title: 'monitoring.operational.metric-compliance',
      value: `${compliance}%`,
      valueUnit: 'monitoring.operational.label-in-range',
      size: 'small',
      color: {
        bg: '#E6F9EB',
        border: '#E6F9EB',
        text: '#10B981',
        chart: '#10B981',
      },
      tooltip: {
        text: 'monitoring.operational.label-avg',
        position: 85,
      },
      chartData: this.buildStatusBars(
        this.organizationReadings()
          .slice(0, 11)
          .map((reading) => (reading.isOutOfRange ? 42 : 92)),
      ),
      highlightedBar: 9,
      showAnchor: false,
    });
  }

  private buildTemperaturePoints(): TemperaturePoint[] {
    const settings = this.currentSettings();
    const maxLimit = settings?.maximumTemperature ?? 7.2;
    const minLimit = settings?.minimumTemperature ?? -5;
    const readings = this.organizationReadings().filter((reading) => reading.temperature !== null);
    const now = new Date();
    const initialTemperature = this.averageAssetTemperature() ?? (minLimit + maxLimit) / 2;
    let previousTemperature = initialTemperature;

    return Array.from({ length: 24 }, (_, index) => {
      const bucketStart = new Date(now);
      bucketStart.setMinutes(0, 0, 0);
      bucketStart.setHours(bucketStart.getHours() - (23 - index));

      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(bucketEnd.getHours() + 1);

      const readingsInBucket = readings.filter((reading) => {
        const recordedAt = new Date(reading.recordedAt).getTime();
        return recordedAt >= bucketStart.getTime() && recordedAt < bucketEnd.getTime();
      });
      const temperature = readingsInBucket.length
        ? this.average(
            readingsInBucket.map((reading) => reading.temperature ?? previousTemperature),
          )
        : previousTemperature;
      const point = new TemperaturePoint({
        id: index + 1,
        label: this.hourLabel(bucketStart.toISOString()),
        temperature: Number(temperature.toFixed(1)),
        ghost: Number(previousTemperature.toFixed(1)),
        maxLimit,
        minLimit,
      });

      previousTemperature = point.temperature;
      return point;
    });
  }

  private buildStorageDistribution(): StorageDistributionItem[] {
    const assets = this.organizationAssets();
    const total = assets.length;

    if (!total) {
      return [];
    }

    const maximumTemperature = this.currentSettings()?.maximumTemperature ?? 8;
    const groups = [
      {
        id: 1,
        label: 'monitoring.operational.storage-frozen',
        count: assets.filter((asset) => {
          const temperature = this.temperatureFromAsset(asset.currentTemperature);
          return temperature !== null && temperature <= 0;
        }).length,
        color: '#91BDFF',
      },
      {
        id: 2,
        label: 'monitoring.operational.storage-refrigerated',
        count: assets.filter((asset) => {
          const temperature = this.temperatureFromAsset(asset.currentTemperature);
          return temperature !== null && temperature > 0 && temperature <= maximumTemperature;
        }).length,
        color: '#51BD7A',
      },
      {
        id: 3,
        label: 'monitoring.operational.storage-ambient',
        count: assets.filter((asset) => {
          const temperature = this.temperatureFromAsset(asset.currentTemperature);
          return temperature !== null && temperature > maximumTemperature;
        }).length,
        color: '#F5BD38',
      },
      {
        id: 4,
        label: 'monitoring.operational.storage-other',
        count: assets.filter(
          (asset) => this.temperatureFromAsset(asset.currentTemperature) === null,
        ).length,
        color: '#9AA3AF',
      },
    ];

    return groups.map(
      (group) =>
        new StorageDistributionItem({
          id: group.id,
          label: group.label,
          assetCount: group.count,
          percentage: Number(((group.count / total) * 100).toFixed(1)),
          color: group.color,
        }),
    );
  }

  private buildMaintenanceTasks(): MaintenanceTask[] {
    const calibrationTasks = this.organizationIoTDevices()
      .filter((iotDevice) => iotDevice.calibrationStatus !== CalibrationStatus.Compliant)
      .slice(0, 3)
      .map(
        (iotDevice, index) =>
          new MaintenanceTask({
            id: index + 1,
            label: `${iotDevice.uuid} · ${iotDevice.model}`,
            icon: iotDevice.calibrationStatus === CalibrationStatus.Expired ? 'warning' : 'sensors',
            status: iotDevice.calibrationStatus === CalibrationStatus.Expired ? 'to-do' : 'doing',
          }),
      );

    const gatewayTasks = this.organizationGateways()
      .filter((gateway) => gateway.status !== GatewayStatus.Active)
      .slice(0, Math.max(0, 5 - calibrationTasks.length))
      .map(
        (gateway, index) =>
          new MaintenanceTask({
            id: calibrationTasks.length + index + 1,
            label: `${gateway.uuid} · ${gateway.location}`,
            icon: gateway.status === GatewayStatus.Offline ? 'wifi_off' : 'router',
            status: gateway.status === GatewayStatus.Offline ? 'to-do' : 'doing',
          }),
      );

    const assetTasks = this.organizationAssets()
      .filter((asset) => asset.status === AssetStatus.Maintenance)
      .slice(0, Math.max(0, 5 - calibrationTasks.length - gatewayTasks.length))
      .map(
        (asset, index) =>
          new MaintenanceTask({
            id: calibrationTasks.length + gatewayTasks.length + index + 1,
            label: `${asset.uuid} · ${asset.name}`,
            icon: 'inventory_2',
            status: 'doing',
          }),
      );

    return [...calibrationTasks, ...gatewayTasks, ...assetTasks].slice(0, 5);
  }

  private buildRecentAlerts(): RecentAlert[] {
    const assets = this.organizationAssets();
    const settings = this.currentSettings();

    const outOfRangeAlerts = this.organizationReadings()
      .filter((reading) => reading.isOutOfRange)
      .slice(0, 4)
      .map((reading) => {
        const asset = assets.find((currentAsset) => currentAsset.id === reading.assetId);
        const severity =
          reading.temperature !== null
            ? this.getThermalSeverity(reading.temperature, settings)
            : 'warning';

        return new RecentAlert({
          id: reading.id,
          assetName: asset?.name ?? `#${reading.assetId}`,
          type: this.alertTypeKey(reading),
          value: this.readingValueLabel(reading),
          date: this.formatDate(reading.recordedAt),
          status: 'Unacknowledged',
          severity: severity === 'normal' ? 'warning' : severity,
          icon:
            reading.temperature !== null
              ? this.getThermalIcon(reading.temperature, settings)
              : this.readingIcon(reading),
        });
      });

    const connectivityAlerts = assets
      .filter((asset) => asset.connectivity !== ConnectivityStatus.Online)
      .slice(0, Math.max(0, 5 - outOfRangeAlerts.length))
      .map(
        (asset) =>
          new RecentAlert({
            id: 10000 + asset.id,
            assetName: asset.name,
            type: 'monitoring.operational.type-connectivity',
            value: asset.connectivity,
            date: asset.entryDate,
            status: 'Unacknowledged',
            severity: asset.connectivity === ConnectivityStatus.Offline ? 'critical' : 'warning',
            icon: 'wifi_off',
          }),
      );

    return [...outOfRangeAlerts, ...connectivityAlerts].slice(0, 5);
  }

  private buildIncidentDays(): IncidentDay[] {
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const days = dayLabels.map((label, index) => ({
      id: index + 1,
      label,
      normal: 0,
      warning: 0,
      critical: 0,
      offline: 0,
    }));

    this.applyReadingIncidents(days, this.organizationReadings(), (reading) => {
      const day = new Date(reading.recordedAt).getDay();
      return day === 0 ? 6 : day - 1;
    });
    days[this.currentWeekdayIndex()].offline += this.currentOfflineCount();

    return days.map((day) => new IncidentDay(day));
  }

  private buildTimeline(): IncidentDay[] {
    const hours = Array.from({ length: 24 }, (_, index) => ({
      id: index + 1,
      label: `${index.toString().padStart(2, '0')}h`,
      normal: 0,
      warning: 0,
      critical: 0,
      offline: 0,
    }));

    this.applyReadingIncidents(hours, this.organizationReadings(), (reading) =>
      new Date(reading.recordedAt).getHours(),
    );
    hours[new Date().getHours()].offline += this.currentOfflineCount();

    return hours.map((hour) => new IncidentDay(hour));
  }

  private applyReadingIncidents(
    buckets: { normal: number; warning: number; critical: number; offline: number }[],
    readings: SensorReading[],
    indexFor: (reading: SensorReading) => number,
  ): void {
    const settings = this.currentSettings();

    readings.forEach((reading) => {
      const bucket = buckets[indexFor(reading)];

      if (!bucket) {
        return;
      }

      const severity =
        reading.temperature !== null
          ? this.getThermalSeverity(reading.temperature, settings)
          : 'warning';

      if (severity === 'normal' && !reading.isOutOfRange) {
        bucket.normal += 1;
      } else if (severity === 'critical') {
        bucket.critical += 1;
      } else {
        bucket.warning += 1;
      }
    });
  }

  private alertTypeKey(reading: SensorReading): string {
    const settings = this.currentSettings();

    if (settings && reading.humidity !== null && reading.humidity > settings.maximumHumidity) {
      return 'monitoring.operational.type-high-humidity';
    }

    if (reading.motionDetected) {
      return 'monitoring.operational.type-motion-detected';
    }

    if (reading.imageCaptured) {
      return 'monitoring.operational.type-image-captured';
    }

    if (reading.batteryLevel !== null && reading.batteryLevel < 15) {
      return 'monitoring.operational.type-low-battery';
    }

    if (reading.signalStrength !== null && reading.signalStrength < 35) {
      return 'monitoring.operational.type-low-signal';
    }

    return settings &&
      reading.temperature !== null &&
      reading.temperature > settings.maximumTemperature
      ? 'monitoring.operational.type-high-temp'
      : 'monitoring.operational.type-low-temp';
  }

  private readingValueLabel(reading: SensorReading): string {
    const values = [
      reading.temperature !== null ? `${reading.temperature.toFixed(1)}°C` : null,
      reading.humidity !== null ? `${reading.humidity}%` : null,
      reading.motionDetected !== null
        ? this.translate.instant(
            reading.motionDetected
              ? 'monitoring.operational.reading-motion'
              : 'monitoring.operational.reading-no-motion',
          )
        : null,
      reading.imageCaptured !== null
        ? this.translate.instant(
            reading.imageCaptured
              ? 'monitoring.operational.reading-image-captured'
              : 'monitoring.operational.reading-no-image',
          )
        : null,
      reading.batteryLevel !== null
        ? `${reading.batteryLevel}% ${this.translate.instant('monitoring.operational.reading-battery')}`
        : null,
      reading.signalStrength !== null
        ? `${reading.signalStrength}% ${this.translate.instant('monitoring.operational.reading-signal')}`
        : null,
    ].filter((value): value is string => !!value);

    return values.join(' / ') || '—';
  }

  private readingIcon(reading: SensorReading): string {
    if (reading.motionDetected) {
      return 'directions_run';
    }

    if (reading.imageCaptured) {
      return 'photo_camera';
    }

    if (reading.batteryLevel !== null && reading.batteryLevel < 15) {
      return 'battery_alert';
    }

    return 'sensors';
  }

  private getThermalSeverity(
    temperature: number,
    settings: AssetSettings | null,
  ): 'normal' | 'warning' | 'critical' {
    if (!settings) {
      return 'normal';
    }

    if (
      temperature > settings.maximumTemperature + 2 ||
      temperature < settings.minimumTemperature - 2
    ) {
      return 'critical';
    }

    if (temperature > settings.maximumTemperature || temperature < settings.minimumTemperature) {
      return 'warning';
    }

    return 'normal';
  }

  private getThermalIcon(temperature: number, settings: AssetSettings | null): string {
    if (!settings) {
      return 'device_thermostat';
    }

    return temperature > settings.maximumTemperature ? 'device_thermostat' : 'ac_unit';
  }

  private buildSummaryBars(values: number[], size: number): number[] {
    const baseValues = values.filter((value) => value > 0);

    if (!baseValues.length) {
      return [];
    }

    const max = Math.max(...baseValues, 1);
    const bars = Array.from({ length: size }, (_, index) => {
      const source = baseValues[index % baseValues.length];
      const variation = index % 2 === 0 ? 1 : 0.72;
      return Math.max(18, Math.round((source / max) * 100 * variation));
    });

    return bars;
  }

  private buildStatusBars(values: number[]): number[] {
    const baseValues = values.length ? values : [0];
    const max = Math.max(...baseValues, 1);

    return Array.from({ length: 11 }, (_, index) => {
      const source = baseValues[index % baseValues.length];
      return Math.max(16, Math.round((source / max) * 100));
    });
  }

  private hourLabel(date: string): string {
    return `${new Date(date).getHours().toString().padStart(2, '0')}:00`;
  }

  private currentWeekdayIndex(): number {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }

  private currentOfflineCount(): number {
    const offlineAssets = this.organizationAssets().filter(
      (asset) => asset.connectivity !== ConnectivityStatus.Online,
    ).length;
    const offlineDevices = this.organizationIoTDevices().filter(
      (iotDevice) => iotDevice.status === IoTDeviceStatus.Offline,
    ).length;
    const offlineGateways = this.organizationGateways().filter(
      (gateway) => gateway.status === GatewayStatus.Offline,
    ).length;

    return offlineAssets + offlineDevices + offlineGateways;
  }

  private averageAssetTemperature(): number | null {
    const temperatures = this.organizationAssets()
      .map((asset) => this.temperatureFromAsset(asset.currentTemperature))
      .filter((temperature): temperature is number => temperature !== null);

    if (!temperatures.length) {
      return null;
    }

    return this.average(temperatures);
  }

  private average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  }

  private temperatureFromAsset(currentTemperature: string): number | null {
    const temperature = Number(currentTemperature.replace('°C', '').trim());
    return Number.isFinite(temperature) ? temperature : null;
  }

  private formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }

  private kpi(config: ConstructorParameters<typeof DashboardKpi>[0]): DashboardKpi {
    return new DashboardKpi(config);
  }
}
