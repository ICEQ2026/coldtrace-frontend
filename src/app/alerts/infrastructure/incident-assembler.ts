import { Incident, IncidentStatus } from '../domain/model/incident.entity';
import { CorrectiveAction } from '../domain/model/corrective-action.entity';
import { IncidentResponse } from './incidents-response';

export class IncidentAssembler {
  static toEntity(response: IncidentResponse): Incident {
    const correctiveAction = response.correctiveAction
      ? new CorrectiveAction(
          response.correctiveAction.description,
          response.correctiveAction.responsible,
          response.correctiveAction.result,
          response.correctiveAction.appliedAt,
        )
      : null;

    return new Incident(
      Number(response.id),
      response.organizationId,
      response.assetId,
      response.type,
      response.severity,
      response.status as IncidentStatus,
      response.detectedAt,
      response.recognizedAt,
      response.resolvedAt,
      correctiveAction,
    );
  }

  static toResponse(incident: Incident): IncidentResponse {
    const correctiveAction = incident.correctiveAction
      ? {
          description: incident.correctiveAction.description,
          responsible: incident.correctiveAction.responsible,
          result: incident.correctiveAction.result,
          appliedAt: incident.correctiveAction.appliedAt,
        }
      : null;

    return {
      id: incident.id,
      organizationId: incident.organizationId,
      assetId: incident.assetId,
      type: incident.type,
      severity: incident.severity,
      status: incident.status as 'open' | 'acknowledged' | 'resolved',
      detectedAt: incident.detectedAt,
      recognizedAt: incident.recognizedAt,
      resolvedAt: incident.resolvedAt,
      correctiveAction,
    };
  }
}
