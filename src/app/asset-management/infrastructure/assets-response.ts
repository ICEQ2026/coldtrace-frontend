import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AssetStatus } from '../domain/model/asset-status.enum';
import { AssetType } from '../domain/model/asset-type.enum';

/**
 * @summary Raw asset resource from the ColdTrace API.
 */
export interface AssetResource extends BaseResource {
  organizationId: number;
  locationId: number;
  uuid: string;
  type: AssetType;
  name: string;
  capacity: number;
  description: string;
  status: AssetStatus;
}

/**
 * @summary Raw response from the ColdTrace API for assets.
 */
export interface AssetsResponse extends BaseResponse {
  assets: AssetResource[];
}
