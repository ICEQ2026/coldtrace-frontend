import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { CorrectiveAction } from './corrective-action.entity';

export enum IncidentStatus {
  Open = 'open',
  Acknowledged = 'acknowledged',
  Resolved = 'resolved',
}

export class Incident implements BaseEntity {
  constructor(
    private readonly _id: number,
    private readonly _organizationId: number,
    private readonly _assetId: number,
    private readonly _type: string,
    private readonly _severity: 'info' | 'warning' | 'critical',
    private readonly _status: IncidentStatus,
    private readonly _detectedAt: string,
    private readonly _recognizedAt: string | null,
    private readonly _resolvedAt: string | null,
    private readonly _correctiveAction: CorrectiveAction | null,
  ) {}

  get id(): number {
    return this._id;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get assetId(): number {
    return this._assetId;
  }

  get type(): string {
    return this._type;
  }

  get severity(): 'info' | 'warning' | 'critical' {
    return this._severity;
  }

  get status(): IncidentStatus {
    return this._status;
  }

  get detectedAt(): string {
    return this._detectedAt;
  }

  get recognizedAt(): string | null {
    return this._recognizedAt;
  }

  get resolvedAt(): string | null {
    return this._resolvedAt;
  }

  get correctiveAction(): CorrectiveAction | null {
    return this._correctiveAction;
  }
}
