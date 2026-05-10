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

type AssetFieldPatch = Partial<{
  status: AssetStatus;
  lastIncident: string;
  currentTemperature: string;
  connectivity: ConnectivityStatus;
}>;

type IoTDeviceFieldPatch = Partial<{
  assetId: number | null;
  status: IoTDeviceStatus;
  calibrationStatus: CalibrationStatus;
  nextCalibrationDate: string;
}>;

type GatewayFieldPatch = Partial<{
  status: GatewayStatus;
}>;

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

  constructor(private assetManagementApi: AssetManagementApi) {}

  assetIssueCountFor(organizationId: number | null): number {
    if (!organizationId) {
      return 0;
    }

    return this.assets().filter((asset) => {
      return asset.organizationId === organizationId && this.hasAssetIssue(asset);
    }).length;
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

  patchAsset(assetId: number, fields: AssetFieldPatch): Observable<Asset> {
    return this.assetManagementApi.patchAsset(assetId, fields).pipe(
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

  patchIoTDevice(iotDeviceId: number, fields: IoTDeviceFieldPatch): Observable<IoTDevice> {
    return this.assetManagementApi.patchIoTDevice(iotDeviceId, fields).pipe(
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

  patchGateway(gatewayId: number, fields: GatewayFieldPatch): Observable<Gateway> {
    return this.assetManagementApi.patchGateway(gatewayId, fields).pipe(
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

  private hasAssetIssue(asset: Asset): boolean {
    return (
      asset.lastIncident !== 'asset-management.incidents.none' ||
      asset.connectivity !== ConnectivityStatus.Online ||
      asset.status !== AssetStatus.Active
    );
  }
}
