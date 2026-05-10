import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Asset } from '../domain/model/asset.entity';
import { Sensor } from '../domain/model/sensor.entity';
import { AssetsApiEndpoint } from './assets-api-endpoint';
import { SensorsApiEndpoint } from './sensors-api-endpoint';

@Injectable({ providedIn: 'root' })
export class AssetManagementApi extends BaseApi {
  private readonly assetsEndpoint: AssetsApiEndpoint;
  private readonly sensorsEndpoint: SensorsApiEndpoint;

  constructor(httpClient: HttpClient) {
    super();
    this.assetsEndpoint = new AssetsApiEndpoint(httpClient);
    this.sensorsEndpoint = new SensorsApiEndpoint(httpClient);
  }

  getAssets(): Observable<Asset[]> {
    return this.assetsEndpoint.getAll();
  }

  createAsset(asset: Asset): Observable<Asset> {
    return this.assetsEndpoint.create(asset);
  }

  getSensors(): Observable<Sensor[]> {
    return this.sensorsEndpoint.getAll();
  }

  updateSensor(sensor: Sensor): Observable<Sensor> {
    return this.sensorsEndpoint.update(sensor, sensor.id);
  }
}
