import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Role } from '../domain/model/role.entity';
import { RoleAssembler } from './role-assembler';
import { RoleResource, RolesResponse } from './roles-response';

export class RolesApiEndpoint extends BaseApiEndpoint<
  Role,
  RoleResource,
  RolesResponse,
  RoleAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderRolesEndpointPath}`,
      new RoleAssembler(),
    );
  }
}
