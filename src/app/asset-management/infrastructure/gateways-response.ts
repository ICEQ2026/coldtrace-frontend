import { GatewayStatus } from '../domain/model/gateway-status.enum';
import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface GatewayResource extends BaseResource {
  organizationId: number;
  uuid: string;
  name: string;
  location: string;
  network: string;
  status: GatewayStatus;
}

export interface GatewaysResponse extends BaseResponse {
  gateways: GatewayResource[];
}
