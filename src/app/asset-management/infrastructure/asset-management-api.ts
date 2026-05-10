import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Asset } from '../domain/model/asset.entity';
import { AssetSettings } from '../domain/model/asset-settings.entity';
import { Gateway } from '../domain/model/gateway.entity';
import { IoTDevice } from '../domain/model/iot-device.entity';
import { AssetSettingsApiEndpoint } from './asset-settings-api-endpoint';
import { AssetsApiEndpoint } from './assets-api-endpoint';
import { GatewaysApiEndpoint } from './gateways-api-endpoint';
import { IoTDevicesApiEndpoint } from './iot-devices-api-endpoint';

@Injectable({ providedIn: 'root' })
export class AssetManagementApi extends BaseApi {
  private readonly assetsEndpoint: AssetsApiEndpoint;
  private readonly iotDevicesEndpoint: IoTDevicesApiEndpoint;
  private readonly gatewaysEndpoint: GatewaysApiEndpoint;
  private readonly assetSettingsEndpoint: AssetSettingsApiEndpoint;

  constructor(httpClient: HttpClient) {
    super();
    this.assetsEndpoint = new AssetsApiEndpoint(httpClient);
    this.iotDevicesEndpoint = new IoTDevicesApiEndpoint(httpClient);
    this.gatewaysEndpoint = new GatewaysApiEndpoint(httpClient);
    this.assetSettingsEndpoint = new AssetSettingsApiEndpoint(httpClient);
  }

  getAssets(): Observable<Asset[]> {
    return this.assetsEndpoint.getAll();
  }

  createAsset(asset: Asset): Observable<Asset> {
    return this.assetsEndpoint.create(asset);
  }

  updateAsset(asset: Asset): Observable<Asset> {
    return this.assetsEndpoint.update(asset, asset.id);
  }

  getIoTDevices(): Observable<IoTDevice[]> {
    return this.iotDevicesEndpoint.getAll();
  }

  createIoTDevice(iotDevice: IoTDevice): Observable<IoTDevice> {
    return this.iotDevicesEndpoint.create(iotDevice);
  }

  updateIoTDevice(iotDevice: IoTDevice): Observable<IoTDevice> {
    return this.iotDevicesEndpoint.update(iotDevice, iotDevice.id);
  }

  getGateways(): Observable<Gateway[]> {
    return this.gatewaysEndpoint.getAll();
  }

  createGateway(gateway: Gateway): Observable<Gateway> {
    return this.gatewaysEndpoint.create(gateway);
  }

  updateGateway(gateway: Gateway): Observable<Gateway> {
    return this.gatewaysEndpoint.update(gateway, gateway.id);
  }

  getAssetSettings(): Observable<AssetSettings[]> {
    return this.assetSettingsEndpoint.getAll();
  }

  createAssetSettings(assetSettings: AssetSettings): Observable<AssetSettings> {
    return this.assetSettingsEndpoint.create(assetSettings);
  }

  updateAssetSettings(assetSettings: AssetSettings): Observable<AssetSettings> {
    return this.assetSettingsEndpoint.update(assetSettings, assetSettings.id);
  }
}
