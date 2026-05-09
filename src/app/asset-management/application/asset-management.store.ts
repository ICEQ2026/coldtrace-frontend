import { computed, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Asset } from '../domain/model/asset.entity';
import { Gateway } from '../domain/model/gateway.entity';
import { Sensor } from '../domain/model/sensor.entity';
import { AssetManagementApi } from '../infrastructure/asset-management-api';

@Injectable({ providedIn: 'root' })
export class AssetManagementStore {
  private readonly assetsSignal = signal<Asset[]>([]);
  private readonly sensorsSignal = signal<Sensor[]>([]);
  private readonly gatewaysSignal = signal<Gateway[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly assets = this.assetsSignal.asReadonly();
  readonly sensors = this.sensorsSignal.asReadonly();
  readonly gateways = this.gatewaysSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly assetCount = computed(() => this.assets().length);

  constructor(private assetManagementApi: AssetManagementApi) {}

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

  loadSensors(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.assetManagementApi.getSensors().subscribe({
      next: (sensors) => {
        this.sensorsSignal.set(sensors);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  updateSensor(sensor: Sensor): Observable<Sensor> {
    return this.assetManagementApi.updateSensor(sensor).pipe(
      tap((updatedSensor) => {
        this.sensorsSignal.update((sensors) =>
          sensors.map((currentSensor) =>
            currentSensor.id === updatedSensor.id ? updatedSensor : currentSensor,
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
}
