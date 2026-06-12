import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Location } from '../domain/model/location.entity';
import { LocationAssembler } from './location-assembler';
import { LocationResource, LocationsResponse } from './locations-response';

/**
 * @summary Connects locations API endpoint resources to the generic API endpoint contract.
 */
export class LocationsApiEndpoint extends BaseApiEndpoint<
  Location,
  LocationResource,
  LocationsResponse,
  LocationAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderLocationsEndpointPath}`,
      new LocationAssembler(),
    );
  }
}
