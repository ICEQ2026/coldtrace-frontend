import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { AssetSettings } from '../domain/model/asset-settings.entity';
import { AssetSettingsAssembler } from './asset-settings-assembler';
import { AssetSettingsResource, AssetSettingsResponse } from './asset-settings-response';

/**
 * @summary Connects asset settings API endpoint resources to the generic API endpoint contract.
 */
export class AssetSettingsApiEndpoint extends BaseApiEndpoint<
  AssetSettings,
  AssetSettingsResource,
  AssetSettingsResponse,
  AssetSettingsAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderAssetSettingsEndpointPath}`,
      new AssetSettingsAssembler(),
    );
  }
}
