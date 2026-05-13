import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import {
  IncidentEscalationStatus,
  IncidentReviewStatus,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  IncidentType,
} from '../domain/model/incident.entity';

/**
 * @summary Raw incident resource from the ColdTrace API.
 */
export interface IncidentResource extends BaseResource {
  organizationId: number;
  assetId: number;
  assetName: string;
  type: IncidentType;
  severity: IncidentSeverity;
  value: string;
  detectedAt: string;
  status: IncidentStatus;
  recognizedBy: string | null;
  recognizedAt: string | null;
  conditionStable?: boolean;
  correctiveAction?: string | null;
  closureEvidence?: string | null;
  closedBy?: string | null;
  closedAt?: string | null;
  conditionKey?: string | null;
  source?: IncidentSource;
  sourceReadingId?: number | null;
  reviewStatus?: IncidentReviewStatus;
  escalationStatus?: IncidentEscalationStatus;
  escalationLevel?: number;
  escalationPolicyMinutes?: number | null;
  escalatedAt?: string | null;
  escalatedTo?: string | null;
  escalationReviewedBy?: string | null;
  escalationReviewedAt?: string | null;
}

/**
 * @summary Raw response from the ColdTrace API for incidents.
 */
export interface IncidentsResponse extends BaseResponse {
  incidents: IncidentResource[];
}
