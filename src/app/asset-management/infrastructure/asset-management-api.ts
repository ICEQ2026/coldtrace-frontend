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

/**
 * @summary Groups asset management API operations used by application stores and views.
 */
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

  /**
   * @summary Fetches assets from the API endpoint.
   */
  getAssets(): Observable<Asset[]> {
    return this.assetsEndpoint.getAll();
  }

  /**
   * @summary Persists an asset and appends it to local state.
   */
  createAsset(asset: Asset): Observable<Asset> {
    return this.assetsEndpoint.create(asset);
  }

  /**
   * @summary Persists asset changes and replaces the local entry.
   */
  updateAsset(asset: Asset): Observable<Asset> {
    return this.assetsEndpoint.update(asset, asset.id);
  }

  /**
   * @summary Fetches IoT devices from the API endpoint.
   */
  getIoTDevices(): Observable<IoTDevice[]> {
    return this.iotDevicesEndpoint.getAll();
  }

  /**
   * @summary Persists an IoT device and appends it to local state.
   */
  createIoTDevice(iotDevice: IoTDevice): Observable<IoTDevice> {
    return this.iotDevicesEndpoint.create(iotDevice);
  }

  /**
   * @summary Persists IoT device changes and replaces the local entry.
   */
  updateIoTDevice(iotDevice: IoTDevice): Observable<IoTDevice> {
    return this.iotDevicesEndpoint.update(iotDevice, iotDevice.id);
  }

  /**
   * @summary Fetches gateways from the API endpoint.
   */
  getGateways(): Observable<Gateway[]> {
    return this.gatewaysEndpoint.getAll();
  }

  /**
   * @summary Persists a gateway and appends it to local state.
   */
  createGateway(gateway: Gateway): Observable<Gateway> {
    return this.gatewaysEndpoint.create(gateway);
  }

  /**
   * @summary Persists gateway changes and replaces the local entry.
   */
  updateGateway(gateway: Gateway): Observable<Gateway> {
    return this.gatewaysEndpoint.update(gateway, gateway.id);
  }

  /**
   * @summary Fetches asset settings from the API endpoint.
   */
  getAssetSettings(): Observable<AssetSettings[]> {
    return this.assetSettingsEndpoint.getAll();
  }

  /**
   * @summary Persists asset settings and appends them to local state.
   */
  createAssetSettings(assetSettings: AssetSettings): Observable<AssetSettings> {
    return this.assetSettingsEndpoint.create(assetSettings);
  }

  /**
   * @summary Persists asset settings changes and replaces the local entry.
   */
  updateAssetSettings(assetSettings: AssetSettings): Observable<AssetSettings> {
    return this.assetSettingsEndpoint.update(assetSettings, assetSettings.id);
  }
}
