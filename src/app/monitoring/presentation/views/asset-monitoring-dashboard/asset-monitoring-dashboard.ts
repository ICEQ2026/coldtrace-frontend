import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';
import { AssetSettings } from '../../../../asset-management/domain/model/asset-settings.entity';
import { Asset } from '../../../../asset-management/domain/model/asset.entity';
import { AssetType } from '../../../../asset-management/domain/model/asset-type.enum';
import { IoTDevice } from '../../../../asset-management/domain/model/iot-device.entity';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { MonitoringStore } from '../../../application/monitoring.store';
import { SensorReading } from '../../../domain/model/sensor-reading.entity';
import { TemperaturePoint } from '../../../domain/model/temperature-point.entity';
import { MonitoringAssetCard } from '../../components/monitoring-asset-card/monitoring-asset-card';

interface AssetMonitoringTab {
  type: AssetType;
  labelKey: string;
}

interface AssetMonitoringItem {
  asset: Asset;
  device: IoTDevice | null;
  latestReading: SensorReading | null;
  settings: AssetSettings | undefined;
  chartPoints: TemperaturePoint[];
}

interface TemperatureLimits {
  min: number;
  max: number;
}

@Component({
  selector: 'app-asset-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule, MonitoringAssetCard],
  templateUrl: './asset-monitoring-dashboard.html',
  styleUrl: './asset-monitoring-dashboard.css',
})
export class AssetMonitoringDashboard implements OnInit {
  private readonly identityStore = inject(IdentityAccessStore);
  private readonly assetStore = inject(AssetManagementStore);
  private readonly monitoringStore = inject(MonitoringStore);

  protected readonly searchTerm = signal('');
  protected readonly tabs: AssetMonitoringTab[] = [
    { type: AssetType.ColdRoom, labelKey: 'monitoring.asset-monitoring.tabs.cold-room' },
    { type: AssetType.Transport, labelKey: 'monitoring.asset-monitoring.tabs.transport' },
  ];
  protected readonly activeType = signal<AssetType>(AssetType.ColdRoom);

  protected readonly activeOrganizationId = computed(() => {
    return this.identityStore.currentOrganizationIdFrom(this.identityStore.users());
  });

  protected readonly filteredItems = computed<AssetMonitoringItem[]>(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const organizationId = this.activeOrganizationId();

    return this.assetStore
      .assetsForOrganization(organizationId)
      .filter((asset) => asset.type === this.activeType())
      .filter((asset) => this.matchesSearch(asset, query))
      .map((asset) => this.buildMonitoringItem(asset))
      .sort((left, right) => {
        const leftIssue = left.latestReading?.isOutOfRange ? 1 : 0;
        const rightIssue = right.latestReading?.isOutOfRange ? 1 : 0;

        return rightIssue - leftIssue || left.asset.name.localeCompare(right.asset.name);
      });
  });

  protected readonly totalAssets = computed(() => this.filteredItems().length);
  protected readonly assetsWithReadings = computed(
    () => this.filteredItems().filter((item) => item.latestReading !== null).length,
  );
  protected readonly assetsOutOfRange = computed(
    () => this.filteredItems().filter((item) => item.latestReading?.isOutOfRange).length,
  );

  ngOnInit(): void {
    this.identityStore.loadUsers();
    this.identityStore.loadOrganizations();
    this.identityStore.loadRoles();
    this.assetStore.loadAssets();
    this.assetStore.loadIoTDevices();
    this.assetStore.loadAssetSettings();
    this.monitoringStore.loadReadings();
  }

  protected updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  private buildMonitoringItem(asset: Asset): AssetMonitoringItem {
    const readings = this.monitoringStore.getReadingsByAsset(asset.id);
    const settings = this.assetStore.settingsForAsset(this.activeOrganizationId(), asset.id);
    const chartReadings = readings
      .filter((reading) => reading.temperature !== null)
      .slice(0, 24)
      .reverse();
    const limits = this.temperatureLimitsFor(chartReadings, settings);

    return {
      asset,
      device: this.linkedDeviceFor(asset),
      latestReading: readings[0] ?? null,
      settings,
      chartPoints: chartReadings.map((reading, index) => this.toTemperaturePoint(reading, index, limits)),
    };
  }

  private linkedDeviceFor(asset: Asset): IoTDevice | null {
    return (
      this.assetStore
        .iotDevicesForOrganization(this.activeOrganizationId())
        .find((device) => device.assetId === asset.id) ?? null
    );
  }

  private toTemperaturePoint(
    reading: SensorReading,
    index: number,
    limits: TemperatureLimits,
  ): TemperaturePoint {
    const temperature = reading.temperature ?? 0;

    return new TemperaturePoint({
      id: reading.id || index,
      label: new Date(reading.recordedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      temperature,
      ghost: temperature,
      maxLimit: limits.max,
      minLimit: limits.min,
    });
  }

  private temperatureLimitsFor(readings: SensorReading[], settings: AssetSettings | undefined): TemperatureLimits {
    if (settings) {
      return {
        min: settings.minimumTemperature,
        max: settings.maximumTemperature,
      };
    }

    const temperatures = readings
      .map((reading) => reading.temperature)
      .filter((temperature): temperature is number => temperature !== null && Number.isFinite(temperature));

    if (!temperatures.length) {
      return { min: 0, max: 1 };
    }

    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);

    if (min === max) {
      return {
        min: Math.floor(min - 1),
        max: Math.ceil(max + 1),
      };
    }

    return {
      min: Math.floor(min),
      max: Math.ceil(max),
    };
  }

  private matchesSearch(asset: Asset, query: string): boolean {
    if (!query) {
      return true;
    }

    return [asset.name, asset.uuid, asset.location, asset.description]
      .join(' ')
      .toLowerCase()
      .includes(query);
  }
}
