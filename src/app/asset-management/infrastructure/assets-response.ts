import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AssetStatus } from '../domain/model/asset-status.enum';
import { AssetType } from '../domain/model/asset-type.enum';
import { ConnectivityStatus } from '../domain/model/connectivity-status.enum';

/**
 * @summary Raw asset resource from the ColdTrace API.
 */
export interface AssetResource extends BaseResource {
  organizationId: number;
  uuid: string;
  type: AssetType;
  gatewayId: number | null;
  name: string;
  location: string;
  capacity: number;
  description: string;
  status: AssetStatus;
  lastIncident: string;
  currentTemperature: string;
  entryDate: string;
  connectivity: ConnectivityStatus;
}

/**
 * @summary Raw response from the ColdTrace API for assets.
 */
export interface AssetsResponse extends BaseResponse {
  assets: AssetResource[];
}
