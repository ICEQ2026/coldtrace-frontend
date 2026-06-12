import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, map, Observable } from 'rxjs';
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
  private readonly organizationEndpointUrl: string;

  constructor(http: HttpClient) {
    const endpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderAssetSettingsEndpointPath}`;
    super(
      http,
      endpointUrl,
      new AssetSettingsAssembler(),
    );
    this.organizationEndpointUrl = endpointUrl.replace(/\/asset-settings$/, '');
  }

  /**
   * @summary Saves default or asset-specific settings using the backend command endpoint.
   */
  override create(entity: AssetSettings): Observable<AssetSettings> {
    return this.save(entity);
  }

  /**
   * @summary Saves default or asset-specific settings using the backend command endpoint.
   */
  override update(entity: AssetSettings, _id?: number): Observable<AssetSettings> {
    return this.save(entity);
  }

  /**
   * @summary Reads the effective settings resolved by the backend for one asset.
   */
  getByAssetId(assetId: number): Observable<AssetSettings> {
    return this.http
      .get<AssetSettingsResource>(`${this.organizationEndpointUrl}/assets/${assetId}/settings`)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to fetch asset settings')),
      );
  }

  private save(entity: AssetSettings): Observable<AssetSettings> {
    const resource = this.toSaveResource(entity);
    const url = entity.assetId
      ? `${this.organizationEndpointUrl}/assets/${entity.assetId}/settings`
      : `${this.endpointUrl}/default`;

    return this.http.put<AssetSettingsResource>(url, resource).pipe(
      map((saved) => this.assembler.toEntityFromResource(saved)),
      catchError(this.handleError('Failed to save asset settings')),
    );
  }

  private toSaveResource(entity: AssetSettings): Partial<AssetSettingsResource> {
    return {
      uuid: entity.uuid,
      assetTypes: entity.assetTypes,
      iotDeviceTypes: entity.iotDeviceTypes,
      minimumTemperature: entity.minimumTemperature,
      maximumTemperature: entity.maximumTemperature,
      minimumHumidity: entity.minimumHumidity,
      maximumHumidity: entity.maximumHumidity,
      calibrationFrequencyDays: entity.calibrationFrequencyDays,
      temperatureUnit: entity.temperatureUnit,
      humidityUnit: entity.humidityUnit,
      weightUnit: entity.weightUnit,
      readingFrequencySeconds: entity.readingFrequencySeconds,
      alertThresholdMinutes: entity.alertThresholdMinutes,
    };
  }
}
