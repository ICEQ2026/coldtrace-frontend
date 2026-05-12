import { computed, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Asset } from '../domain/model/asset.entity';
import { AssetSettings } from '../domain/model/asset-settings.entity';
import { AssetStatus } from '../domain/model/asset-status.enum';
import { CalibrationStatus } from '../domain/model/calibration-status.enum';
import { ConnectivityStatus } from '../domain/model/connectivity-status.enum';
import { Gateway } from '../domain/model/gateway.entity';
import { GatewayStatus } from '../domain/model/gateway-status.enum';
import { IoTDevice } from '../domain/model/iot-device.entity';
import { IoTDeviceStatus } from '../domain/model/iot-device-status.enum';
import { AssetManagementApi } from '../infrastructure/asset-management-api';

export interface AssetOperationalSummary {
  totalAssets: number;
  monitoredAssets: number;
  connectedDevices: number;
  totalDevices: number;
  connectedGateways: number;
  assetsWithIssues: number;
  connectivityIssues: number;
}

@Injectable({ providedIn: 'root' })
export class AssetManagementStore {
  private readonly assetsSignal = signal<Asset[]>([]);
  private readonly iotDevicesSignal = signal<IoTDevice[]>([]);
  private readonly gatewaysSignal = signal<Gateway[]>([]);
  private readonly assetSettingsSignal = signal<AssetSettings[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly assets = this.assetsSignal.asReadonly();
  readonly iotDevices = this.iotDevicesSignal.asReadonly();
  readonly gateways = this.gatewaysSignal.asReadonly();
  readonly assetSettings = this.assetSettingsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly assetCount = computed(() => this.assets().length);
  private telemetryUpdateStep = 0;

  constructor(private assetManagementApi: AssetManagementApi) {}

  assetIssueCountFor(organizationId: number | null): number {
    if (!organizationId) {
      return 0;
    }

    return this.assets().filter((asset) => {
      return asset.organizationId === organizationId && this.hasAssetIssue(asset);
    }).length;
  }

  assetsForOrganization(organizationId: number | null): Asset[] {
    if (!organizationId) {
      return [];
    }

    return this.assets().filter((asset) => asset.organizationId === organizationId);
  }

  iotDevicesForOrganization(organizationId: number | null): IoTDevice[] {
    if (!organizationId) {
      return [];
    }

    return this.iotDevices().filter((iotDevice) => iotDevice.organizationId === organizationId);
  }

  gatewaysForOrganization(organizationId: number | null): Gateway[] {
    if (!organizationId) {
      return [];
    }

    return this.gateways().filter((gateway) => gateway.organizationId === organizationId);
  }

  operationalSummaryFor(organizationId: number | null): AssetOperationalSummary {
    const assets = this.assetsForOrganization(organizationId);
    const iotDevices = this.iotDevicesForOrganization(organizationId);
    const gateways = this.gatewaysForOrganization(organizationId);
    const monitoredAssetIds = new Set(
      iotDevices
        .filter((iotDevice) => iotDevice.assetId !== null)
        .map((iotDevice) => iotDevice.assetId),
    );

    return {
      totalAssets: assets.length,
      monitoredAssets: assets.filter((asset) => monitoredAssetIds.has(asset.id)).length,
      connectedDevices: iotDevices.filter((iotDevice) => iotDevice.status === IoTDeviceStatus.Linked).length,
      totalDevices: iotDevices.length,
      connectedGateways: gateways.filter((gateway) => gateway.status === GatewayStatus.Active).length,
      assetsWithIssues: assets.filter((asset) => this.hasAssetIssue(asset)).length,
      connectivityIssues: assets.filter((asset) => asset.connectivity !== ConnectivityStatus.Online).length,
    };
  }

  loadAssets(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.assetManagementApi.getAssets().subscribe({
      next: (assets) => {
        this.assetsSignal.set(assets);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  createAsset(asset: Asset): Observable<Asset> {
    return this.assetManagementApi.createAsset(asset).pipe(
      tap((createdAsset) => {
        this.assetsSignal.update((assets) => [...assets, createdAsset]);
      }),
    );
  }

  updateAsset(asset: Asset): Observable<Asset> {
    return this.assetManagementApi.updateAsset(asset).pipe(
      tap((updatedAsset) => {
        this.assetsSignal.update((assets) =>
          assets.map((currentAsset) =>
            currentAsset.id === updatedAsset.id ? updatedAsset : currentAsset,
          ),
        );
      }),
    );
  }

  loadIoTDevices(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.assetManagementApi.getIoTDevices().subscribe({
      next: (iotDevices) => {
        this.iotDevicesSignal.set(iotDevices);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  createIoTDevice(iotDevice: IoTDevice): Observable<IoTDevice> {
    return this.assetManagementApi.createIoTDevice(iotDevice).pipe(
      tap((createdIoTDevice) => {
        this.iotDevicesSignal.update((iotDevices) => [...iotDevices, createdIoTDevice]);
      }),
    );
  }

  updateIoTDevice(iotDevice: IoTDevice): Observable<IoTDevice> {
    return this.assetManagementApi.updateIoTDevice(iotDevice).pipe(
      tap((updatedIoTDevice) => {
        this.iotDevicesSignal.update((iotDevices) =>
          iotDevices.map((currentIoTDevice) =>
            currentIoTDevice.id === updatedIoTDevice.id ? updatedIoTDevice : currentIoTDevice,
          ),
        );
      }),
    );
  }

  loadGateways(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.assetManagementApi.getGateways().subscribe({
      next: (gateways) => {
        this.gatewaysSignal.set(gateways);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  createGateway(gateway: Gateway): Observable<Gateway> {
    return this.assetManagementApi.createGateway(gateway).pipe(
      tap((createdGateway) => {
        this.gatewaysSignal.update((gateways) => [...gateways, createdGateway]);
      }),
    );
  }

  updateGateway(gateway: Gateway): Observable<Gateway> {
    return this.assetManagementApi.updateGateway(gateway).pipe(
      tap((updatedGateway) => {
        this.gatewaysSignal.update((gateways) =>
          gateways.map((currentGateway) =>
            currentGateway.id === updatedGateway.id ? updatedGateway : currentGateway,
          ),
        );
      }),
    );
  }

  loadAssetSettings(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.assetManagementApi.getAssetSettings().subscribe({
      next: (assetSettings) => {
        this.assetSettingsSignal.set(assetSettings);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  createAssetSettings(assetSettings: AssetSettings): Observable<AssetSettings> {
    return this.assetManagementApi.createAssetSettings(assetSettings).pipe(
      tap((createdAssetSettings) => {
        this.assetSettingsSignal.update((settings) => [...settings, createdAssetSettings]);
      }),
    );
  }

  updateAssetSettings(assetSettings: AssetSettings): Observable<AssetSettings> {
    return this.assetManagementApi.updateAssetSettings(assetSettings).pipe(
      tap((updatedAssetSettings) => {
        this.assetSettingsSignal.update((settings) =>
          settings.map((currentSettings) =>
            currentSettings.id === updatedAssetSettings.id ? updatedAssetSettings : currentSettings,
          ),
        );
      }),
    );
  }

  updateOrganizationTelemetry(organizationId: number | null): void {
    if (!organizationId) {
      return;
    }

    const assets = this.assetsForOrganization(organizationId);
    const iotDevices = this.iotDevicesForOrganization(organizationId);
    const gateways = this.gatewaysForOrganization(organizationId);
    const settings = this.assetSettings().find(
      (assetSettings) => assetSettings.organizationId === organizationId,
    );
    const currentStep = this.telemetryUpdateStep % 3;
    this.telemetryUpdateStep += 1;

    if (currentStep === 0) {
      const gateway = this.sampleOne(gateways);

      if (gateway) {
        this.updateGateway(
          this.nextGateway(gateway, {
            status: this.randomGatewayStatus(),
          }),
        ).subscribe({ error: () => undefined });
      }

      return;
    }

    if (currentStep === 1) {
      const iotDevice = this.sampleOne(iotDevices);

      if (iotDevice) {
        this.updateIoTDevice(
          this.nextIoTDevice(iotDevice, {
            status: this.randomIoTDeviceStatus(iotDevice),
            calibrationStatus: this.randomCalibrationStatus(),
          }),
        ).subscribe({ error: () => undefined });
      }

      return;
    }

    const asset = this.sampleOne(assets);

    if (!asset) {
      return;
    }

    const gateway = gateways.find((currentGateway) => currentGateway.id === asset.gatewayId);
    const iotDevice = iotDevices.find((currentIoTDevice) => currentIoTDevice.assetId === asset.id);
    const connectivity = this.randomConnectivity(gateway ?? null, iotDevice ?? null);
    const currentTemperature = this.randomTemperature(connectivity, settings);

    this.updateAsset(
      this.nextAsset(asset, {
        lastIncident: this.incidentFor(currentTemperature, connectivity, settings),
        currentTemperature,
        connectivity,
      }),
    ).subscribe({ error: () => undefined });
  }

  private hasAssetIssue(asset: Asset): boolean {
    return (
      asset.lastIncident !== 'none' ||
      asset.connectivity !== ConnectivityStatus.Online ||
      asset.status !== AssetStatus.Active
    );
  }

  private nextAsset(
    asset: Asset,
    fields: Partial<{
      status: AssetStatus;
      lastIncident: string;
      currentTemperature: string;
      connectivity: ConnectivityStatus;
    }>,
  ): Asset {
    return new Asset(
      asset.id,
      asset.organizationId,
      asset.uuid,
      asset.type,
      asset.gatewayId,
      asset.name,
      asset.location,
      asset.capacity,
      asset.description,
      fields.status ?? asset.status,
      fields.lastIncident ?? asset.lastIncident,
      fields.currentTemperature ?? asset.currentTemperature,
      asset.entryDate,
      fields.connectivity ?? asset.connectivity,
    );
  }

  private nextIoTDevice(
    iotDevice: IoTDevice,
    fields: Partial<{
      assetId: number | null;
      status: IoTDeviceStatus;
      calibrationStatus: CalibrationStatus;
      nextCalibrationDate: string;
    }>,
  ): IoTDevice {
    return new IoTDevice(
      iotDevice.id,
      iotDevice.organizationId,
      iotDevice.uuid,
      iotDevice.deviceType,
      iotDevice.model,
      iotDevice.measurementType,
      fields.assetId ?? iotDevice.assetId,
      fields.status ?? iotDevice.status,
      fields.calibrationStatus ?? iotDevice.calibrationStatus,
      iotDevice.lastCalibrationDate,
      fields.nextCalibrationDate ?? iotDevice.nextCalibrationDate,
      iotDevice.measurementParameters,
      iotDevice.readingFrequencySeconds,
    );
  }

  private nextGateway(
    gateway: Gateway,
    fields: Partial<{
      status: GatewayStatus;
    }>,
  ): Gateway {
    return new Gateway(
      gateway.id,
      gateway.organizationId,
      gateway.uuid,
      gateway.name,
      gateway.location,
      gateway.network,
      fields.status ?? gateway.status,
    );
  }

  private randomTemperature(
    connectivity: ConnectivityStatus,
    settings: AssetSettings | undefined,
  ): string {
    if (connectivity === ConnectivityStatus.Offline) {
      return '—';
    }

    const minimum = settings?.minimumTemperature ?? -5;
    const maximum = settings?.maximumTemperature ?? 8;
    const anomalyRoll = Math.random();
    let temperature: number;

    if (anomalyRoll < 0.94) {
      temperature = this.randomNumber(minimum, maximum);
    } else if (anomalyRoll < 0.97) {
      temperature = this.randomNumber(minimum - 2, minimum - 0.2);
    } else {
      temperature = this.randomNumber(maximum + 0.2, maximum + 3);
    }

    return `${temperature.toFixed(1)}${settings?.temperatureUnit ?? '°C'}`;
  }

  private incidentFor(
    currentTemperature: string,
    connectivity: ConnectivityStatus,
    settings: AssetSettings | undefined,
  ): string {
    if (connectivity === ConnectivityStatus.Offline) {
      return 'connection-lost';
    }

    const temperature = Number(currentTemperature.replace(/[^\d.-]/g, ''));

    if (settings && temperature > settings.maximumTemperature) {
      return 'high-temperature';
    }

    if (settings && temperature < settings.minimumTemperature) {
      return 'low-temperature';
    }

    return Math.random() < 0.03 ? 'high-humidity' : 'none';
  }

  private randomConnectivity(
    gateway: Gateway | null,
    iotDevice: IoTDevice | null,
  ): ConnectivityStatus {
    if (
      !iotDevice ||
      gateway?.status === GatewayStatus.Offline ||
      iotDevice.status === IoTDeviceStatus.Offline
    ) {
      return ConnectivityStatus.Offline;
    }

    if (gateway?.status === GatewayStatus.Maintenance) {
      return Math.random() < 0.75 ? ConnectivityStatus.Online : ConnectivityStatus.Unstable;
    }

    const randomValue = Math.random();

    if (randomValue < 0.92) {
      return ConnectivityStatus.Online;
    }

    if (randomValue < 0.98) {
      return ConnectivityStatus.Unstable;
    }

    return ConnectivityStatus.Offline;
  }

  private randomIoTDeviceStatus(iotDevice: IoTDevice): IoTDeviceStatus {
    if (!iotDevice.assetId) {
      return Math.random() < 0.96 ? IoTDeviceStatus.Available : IoTDeviceStatus.Offline;
    }

    return Math.random() < 0.96 ? IoTDeviceStatus.Linked : IoTDeviceStatus.Offline;
  }

  private randomCalibrationStatus(): CalibrationStatus {
    const randomValue = Math.random();

    if (randomValue < 0.76) {
      return CalibrationStatus.Compliant;
    }

    if (randomValue < 0.93) {
      return CalibrationStatus.DueSoon;
    }

    if (randomValue < 0.98) {
      return CalibrationStatus.Expired;
    }

    return CalibrationStatus.Unknown;
  }

  private randomGatewayStatus(): GatewayStatus {
    const randomValue = Math.random();

    if (randomValue < 0.92) {
      return GatewayStatus.Active;
    }

    if (randomValue < 0.98) {
      return GatewayStatus.Maintenance;
    }

    return GatewayStatus.Offline;
  }

  private randomNumber(minimum: number, maximum: number): number {
    return minimum + Math.random() * (maximum - minimum);
  }

  private sampleOne<T>(items: T[]): T | null {
    if (!items.length) {
      return null;
    }

    return items[Math.floor(Math.random() * items.length)];
  }
}
