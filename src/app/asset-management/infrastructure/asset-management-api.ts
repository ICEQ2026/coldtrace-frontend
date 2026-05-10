import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Asset } from '../domain/model/asset.entity';
import { AssetsApiEndpoint } from './assets-api-endpoint';

@Injectable({ providedIn: 'root' })
export class AssetManagementApi extends BaseApi {
  private readonly assetsEndpoint: AssetsApiEndpoint;

  constructor(httpClient: HttpClient) {
    super();
    this.assetsEndpoint = new AssetsApiEndpoint(httpClient);
  }

  getAssets(): Observable<Asset[]> {
    return this.assetsEndpoint.getAll();
  }

  createAsset(asset: Asset): Observable<Asset> {
    return this.assetsEndpoint.create(asset);
  }
}
