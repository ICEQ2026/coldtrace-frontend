import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';
import { ConnectivityStatus } from '../../../../asset-management/domain/model/connectivity-status.enum';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { DashboardShell } from '../../../../shared/presentation/components/dashboard-shell/dashboard-shell';
import { MonitoringStore } from '../../../application/monitoring.store';
import { DashboardKpi } from '../../../domain/model/dashboard-kpi.entity';
import { IncidentDay } from '../../../domain/model/incident-day.entity';
import { MaintenanceTask } from '../../../domain/model/maintenance-task.entity';
import { RecentAlert } from '../../../domain/model/recent-alert.entity';
import { SensorReading } from '../../../domain/model/sensor-reading.entity';
import { StorageDistributionItem } from '../../../domain/model/storage-distribution-item.entity';
import { TemperaturePoint } from '../../../domain/model/temperature-point.entity';
import { ThermalSeverityService } from '../../../domain/services/thermal-severity.service';
import { IncidentsChart } from '../../components/incidents-chart/incidents-chart';
import { MaintenanceList } from '../../components/maintenance-list/maintenance-list';
import { RecentAlerts } from '../../components/recent-alerts/recent-alerts';
import { StatCard } from '../../components/stat-card/stat-card';
import { StorageDistribution } from '../../components/storage-distribution/storage-distribution';
import { TemperatureChart } from '../../components/temperature-chart/temperature-chart';

@Component({
  selector: 'app-operational-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardShell,
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
  private readonly severityService = inject(ThermalSeverityService);
  private readonly router = inject(Router);

  protected readonly dashboardTemplate = computed(() => this.monitoringStore.operationalDashboard());
  protected readonly activeOrganizationId = computed(() => {
    return this.identityStore.currentOrganizationIdFrom(this.identityStore.users());
  });
  protected readonly organizationAssets = computed(() => {
    return this.assetStore.assetsForOrganization(this.activeOrganizationId());
  });
  protected readonly organizationAssetIds = computed(() => {
    return this.organizationAssets().map((asset) => asset.id);
  });
  protected readonly organizationReadings = computed(() => {
    return this.monitoringStore.readingsForAssetIds(this.organizationAssetIds());
  });
  protected readonly assetSummary = computed(() => {
    return this.assetStore.operationalSummaryFor(this.activeOrganizationId());
  });
  protected readonly currentSettings = computed(() => {
    return this.assetStore.assetSettings().find((s) => s.organizationId === this.activeOrganizationId()) ?? null;
  });
  protected readonly monitoredAssetsKpi = computed(() => this.dashboardKpi('monitored-assets') ?? this.buildMonitoredAssetsKpi());
  protected readonly criticalAlertsKpi = computed(() => this.dashboardKpi('critical-alerts') ?? this.buildCriticalAlertsKpi());
  protected readonly activeSensorsKpi = computed(() => this.dashboardKpi('active-sensors') ?? this.buildActiveSensorsKpi());
  protected readonly incidentsKpi = computed(() => this.dashboardKpi('incidents') ?? this.buildIncidentsKpi());
  protected readonly thermalComplianceKpi = computed(() => this.dashboardKpi('thermal-compliance') ?? this.buildThermalComplianceKpi());
  protected readonly temperaturePoints = computed(() => this.dashboardTemplate()?.temperaturePoints ?? this.buildTemperaturePoints());
  protected readonly storageDistribution = computed(() => {
    const seeded = this.dashboardTemplate()?.storageDistribution;
    if (seeded?.length) {
      return seeded.map(item => new StorageDistributionItem({
        id: item.id,
        label: this.storageLabelKey(item.label),
        assetCount: item.assetCount,
        percentage: item.percentage,
        color: item.color,
      }));
    }
    return this.buildStorageDistribution();
  });
  protected readonly maintenanceTasks = computed(() => this.dashboardTemplate()?.maintenanceTasks ?? []);
  protected readonly recentAlerts = computed(() => {
    const seeded = this.dashboardTemplate()?.recentAlerts;
    if (seeded?.length) {
      return seeded.map(alert => new RecentAlert({
        id: alert.id,
        assetName: alert.assetName,
        type: this.alertTypeLabelKey(alert.type),
        value: alert.value,
        date: alert.date,
        status: alert.status,
        severity: alert.severity,
        icon: alert.icon,
      }));
    }
    return this.buildRecentAlerts();
  });
  protected readonly incidentDays = computed(() => this.dashboardTemplate()?.incidentDays ?? this.buildIncidentDays());
  protected readonly timeline = computed(() => this.dashboardTemplate()?.timeline ?? this.buildTimeline());
  protected readonly maintenanceCompletionRate = computed(() => {
    const seededRate = this.dashboardTemplate()?.maintenanceCompletionRate;

    if (seededRate !== undefined) {
      return seededRate;
    }

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
    return this.identityStore.canManageAccess(this.identityStore.users(), this.identityStore.roles());
  });
  protected readonly identityLoading = computed(() => this.identityStore.loading());
  protected readonly openAlertsCount = computed(() => this.recentAlerts().length);
  protected readonly hasOperationalData = computed(() => {
    return !!this.dashboardTemplate() || this.assetSummary().totalAssets > 0 || this.organizationReadings().length > 0;
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
    this.monitoringStore.loadDashboard();
  }

  protected logout(): void {
    this.identityStore.clearCurrentUser();
    void this.router.navigate(['/identity-access/sign-in']);
  }

  private dashboardKpi(key: string): DashboardKpi | null {
    return this.dashboardTemplate()?.getKpiByKey(key) ?? null;
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
      color: { bg: '', border: '', text: '', chart: '' },
      tooltip: { text: '', position: 0 },
      chartData: [],
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
      color: { bg: '', border: '', text: '', chart: '' },
      tooltip: { text: '', position: 0 },
      chartData: [],
    });
  }

  private buildActiveSensorsKpi(): DashboardKpi {
    const summary = this.assetSummary();

    return this.kpi({
      id: 3,
      key: 'active-sensors',
      title: 'monitoring.operational.metric-sensors',
      value: `${summary.connectedDevices}`,
      valueUnit: 'monitoring.operational.unit-sensors',
      size: 'small',
      color: { bg: '', border: '', text: '', chart: '' },
      tooltip: { text: '', position: 0 },
      chartData: [],
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
      color: { bg: '', border: '', text: '', chart: '' },
      tooltip: { text: '', position: 0 },
      chartData: [],
    });
  }

  private buildThermalComplianceKpi(): DashboardKpi {
    const summary = this.assetSummary();
    const compliance = this.monitoringStore.thermalComplianceForAssetIds(this.organizationAssetIds());

    return this.kpi({
      id: 5,
      key: 'thermal-compliance',
      title: 'monitoring.operational.metric-compliance',
      value: `${compliance}%`,
      valueUnit: 'monitoring.operational.label-in-range',
      size: 'small',
      color: { bg: '', border: '', text: '', chart: '' },
      tooltip: { text: '', position: 0 },
      chartData: [],
    });
  }

  private buildTemperaturePoints(): TemperaturePoint[] {
    const seededPoints = this.dashboardTemplate()?.temperaturePoints;

    if (seededPoints?.length) {
      return seededPoints;
    }

    const recent = [...this.organizationReadings()]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-25);

    const settings = this.currentSettings();
    const maxLimit = settings?.maximumTemperature ?? 7.2;
    const minLimit = settings?.minimumTemperature ?? -5;

    return recent.map((reading, index) => new TemperaturePoint({
      id: reading.id,
      label: this.hourLabel(reading.recordedAt),
      temperature: reading.temperature,
      ghost: recent[index - 1]?.temperature ?? reading.temperature,
      maxLimit,
      minLimit,
    }));
  }

  private buildStorageDistribution(): StorageDistributionItem[] {
    const seededDistribution = this.dashboardTemplate()?.storageDistribution;

    if (seededDistribution?.length) {
      return seededDistribution.map(item => new StorageDistributionItem({
        id: item.id,
        label: this.storageLabelKey(item.label),
        assetCount: item.assetCount,
        percentage: item.percentage,
        color: item.color,
      }));
    }

    const assets = this.organizationAssets();
    const total = assets.length;

    if (!total) {
      return [];
    }

    const settings = this.currentSettings();
    const minTemp = settings?.minimumTemperature ?? 0;
    const maxTemp = settings?.maximumTemperature ?? 8;

    const latestReadings = assets.map(asset => this.monitoringStore.getLatestTemperatureByAsset(asset.id));
    const groups = [
      { id: 1, label: 'monitoring.operational.storage-frozen', count: latestReadings.filter(value => value !== null && value < minTemp).length, color: '' },
      { id: 2, label: 'monitoring.operational.storage-refrigerated', count: latestReadings.filter(value => value !== null && value >= minTemp && value <= maxTemp).length, color: '' },
      { id: 3, label: 'monitoring.operational.storage-ambient', count: latestReadings.filter(value => value !== null && value > maxTemp).length, color: '' },
      { id: 4, label: 'monitoring.operational.storage-other', count: latestReadings.filter(value => value === null).length, color: '' },
    ].filter(group => group.count > 0);

    return groups.map((group) => new StorageDistributionItem({
      id: group.id,
      label: group.label,
      assetCount: group.count,
      percentage: Number(((group.count / total) * 100).toFixed(1)),
      color: group.color,
    }));
  }

  private buildRecentAlerts(): RecentAlert[] {
    const seededAlerts = this.dashboardTemplate()?.recentAlerts;

    if (seededAlerts?.length) {
      return seededAlerts.map(alert => new RecentAlert({
        id: alert.id,
        assetName: alert.assetName,
        type: this.alertTypeLabelKey(alert.type),
        value: alert.value,
        date: alert.date,
        status: alert.status,
        severity: alert.severity,
        icon: alert.icon,
      }));
    }

    const assets = this.organizationAssets();
    const settings = this.currentSettings();
    const maxTemp = settings?.maximumTemperature ?? 8;
    const minTemp = settings?.minimumTemperature ?? -5;

    const outOfRangeAlerts = this.organizationReadings()
      .filter((reading) => reading.isOutOfRange)
      .slice(0, 4)
      .map((reading) => {
        const asset = assets.find((currentAsset) => currentAsset.id === reading.assetId);
        const severity = this.severityService.getSeverity(reading.temperature, settings);

        return new RecentAlert({
          id: reading.id,
          assetName: asset?.name ?? `#${reading.assetId}`,
          type: this.alertTypeKey(reading),
          value: `${reading.temperature.toFixed(1)}°C`,
          date: this.formatDate(reading.recordedAt),
          status: 'Unacknowledged',
          severity: severity === 'normal' ? 'warning' : severity,
          icon: this.severityService.getIcon(reading.temperature, settings),
        });
      });
    const connectivityAlerts = assets
      .filter((asset) => asset.connectivity !== ConnectivityStatus.Online)
      .slice(0, Math.max(0, 5 - outOfRangeAlerts.length))
      .map((asset) => new RecentAlert({
        id: 10000 + asset.id,
        assetName: asset.name,
        type: 'monitoring.operational.type-connectivity',
        value: asset.connectivity,
        date: asset.entryDate,
        status: 'Unacknowledged',
        severity: asset.connectivity === ConnectivityStatus.Offline ? 'critical' : 'warning',
        icon: 'wifi_off',
      }));

    return [...outOfRangeAlerts, ...connectivityAlerts].slice(0, 5);
  }

  private buildIncidentDays(): IncidentDay[] {
    const seededDays = this.dashboardTemplate()?.incidentDays;

    if (seededDays?.length) {
      return seededDays;
    }

    return this.groupReadingsByLabel(
      this.organizationReadings(),
      (reading) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(reading.recordedAt)).slice(0, 1),
      7,
    );
  }

  private buildTimeline(): IncidentDay[] {
    const seededTimeline = this.dashboardTemplate()?.timeline;

    if (seededTimeline?.length) {
      return seededTimeline;
    }

    return this.groupReadingsByLabel(
      this.organizationReadings(),
      (reading) => `${new Date(reading.recordedAt).getHours().toString().padStart(2, '0')}h`,
      24,
    );
  }

  private groupReadingsByLabel(readings: SensorReading[], labelFor: (reading: SensorReading) => string, limit: number): IncidentDay[] {
    const grouped = new Map<string, { normal: number; warning: number; critical: number; offline: number }>();
    const settings = this.currentSettings();
    const maxTemp = settings?.maximumTemperature ?? 8;
    const minTemp = settings?.minimumTemperature ?? -5;

    readings.forEach((reading) => {
      const label = labelFor(reading);
      const current = grouped.get(label) ?? { normal: 0, warning: 0, critical: 0, offline: 0 };
      const severity = this.severityService.getSeverity(reading.temperature, settings);

      if (severity === 'normal' && !reading.isOutOfRange) {
        current.normal += 1;
      } else if (severity === 'critical') {
        current.critical += 1;
      } else {
        current.warning += 1;
      }

      grouped.set(label, current);
    });

    return Array.from(grouped.entries()).slice(0, limit).map(([label, values], index) => new IncidentDay({
      id: index + 1,
      label,
      normal: values.normal,
      warning: values.warning,
      critical: values.critical,
      offline: index === 0 ? this.assetSummary().connectivityIssues : 0,
    }));
  }

  private alertTypeKey(reading: SensorReading): string {
    return reading.temperature > 8
      ? 'monitoring.operational.type-high-temp'
      : 'monitoring.operational.type-low-temp';
  }

  private alertTypeLabelKey(type: string): string {
    const keyByType: Record<string, string> = {
      'High temperature': 'monitoring.operational.type-high-temp',
      'Low temperature': 'monitoring.operational.type-low-temp',
      'High humidity': 'monitoring.operational.type-high-humidity',
      'Connection lost': 'monitoring.operational.type-connectivity',
    };

    return keyByType[type] ?? type;
  }

  private storageLabelKey(label: string): string {
    const keyByLabel: Record<string, string> = {
      Frozen: 'monitoring.operational.storage-frozen',
      Refrigerated: 'monitoring.operational.storage-refrigerated',
      Ambient: 'monitoring.operational.storage-ambient',
      Other: 'monitoring.operational.storage-other',
    };

    return keyByLabel[label] ?? label;
  }

  private hourLabel(date: string): string {
    return `${new Date(date).getHours().toString().padStart(2, '0')}:00`;
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
