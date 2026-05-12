import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { IncidentSeverity, IncidentStatus, IncidentType } from '../domain/model/incident.entity';

export interface IncidentResource extends BaseResource {
  assetId: number;
  assetName: string;
  type: IncidentType;
  severity: IncidentSeverity;
  value: string;
  detectedAt: string;
  status: IncidentStatus;
  recognizedBy: string | null;
  recognizedAt: string | null;
}

export interface IncidentsResponse extends BaseResponse {
  incidents: IncidentResource[];
}
