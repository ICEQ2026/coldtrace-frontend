import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * @summary Raw location resource from the ColdTrace backend API.
 */
export interface LocationResource extends BaseResource {
  organizationId: number;
  name: string;
  type: string;
  address: string;
  description: string;
  status: string;
}

/**
 * @summary Raw response from the ColdTrace API for locations.
 */
export interface LocationsResponse extends BaseResponse {
  locations: LocationResource[];
}
