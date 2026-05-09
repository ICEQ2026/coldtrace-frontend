import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Gateway } from '../domain/model/gateway.entity';
import { GatewayAssembler } from './gateway-assembler';
import { GatewayResource, GatewaysResponse } from './gateways-response';

export class GatewaysApiEndpoint extends BaseApiEndpoint<
  Gateway,
  GatewayResource,
  GatewaysResponse,
  GatewayAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderGatewaysEndpointPath}`,
      new GatewayAssembler(),
    );
  }
}
