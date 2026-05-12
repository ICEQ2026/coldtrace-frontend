import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Incident } from '../domain/model/incident.entity';
import { IncidentAssembler } from './incident-assembler';
import { IncidentResource, IncidentsResponse } from './incident-resource';

export class IncidentsApiEndpoint extends BaseApiEndpoint<Incident, IncidentResource, IncidentsResponse, IncidentAssembler> {
  constructor(http: HttpClient) {
    super(http, environment.platformProviderApiBaseUrl + environment.platformProviderIncidentsEndpointPath, new IncidentAssembler());
  }
}
