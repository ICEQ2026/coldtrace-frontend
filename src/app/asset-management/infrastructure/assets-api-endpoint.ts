import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Asset } from '../domain/model/asset.entity';
import { AssetAssembler } from './asset-assembler';
import { AssetResource, AssetsResponse } from './assets-response';

export class AssetsApiEndpoint extends BaseApiEndpoint<
  Asset,
  AssetResource,
  AssetsResponse,
  AssetAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderAssetsEndpointPath}`,
      new AssetAssembler(),
    );
  }
}
