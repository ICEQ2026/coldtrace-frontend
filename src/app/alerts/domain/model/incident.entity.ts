import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type IncidentStatus = 'open' | 'recognized' | 'closed';
export type IncidentSeverity = 'warning' | 'critical';
export type IncidentType = 'temperature' | 'humidity' | 'connectivity' | 'other';

export class Incident implements BaseEntity {
  private _id: number;
  private _organizationId: number;
  private _assetId: number;
  private _assetName: string;
  private _type: IncidentType;
  private _severity: IncidentSeverity;
  private _value: string;
  private _detectedAt: string;
  private _status: IncidentStatus;
  private _recognizedBy: string | null;
  private _recognizedAt: string | null;

  constructor(incident: {
    id: number;
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
  }) {
    this._id = incident.id;
    this._organizationId = incident.organizationId;
    this._assetId = incident.assetId;
    this._assetName = incident.assetName;
    this._type = incident.type;
    this._severity = incident.severity;
    this._value = incident.value;
    this._detectedAt = incident.detectedAt;
    this._status = incident.status;
    this._recognizedBy = incident.recognizedBy;
    this._recognizedAt = incident.recognizedAt;
  }

  get id(): number { return this._id; }
  get organizationId(): number { return this._organizationId; }
  get assetId(): number { return this._assetId; }
  get assetName(): string { return this._assetName; }
  get type(): IncidentType { return this._type; }
  get severity(): IncidentSeverity { return this._severity; }
  get value(): string { return this._value; }
  get detectedAt(): string { return this._detectedAt; }
  get status(): IncidentStatus { return this._status; }
  get recognizedBy(): string | null { return this._recognizedBy; }
  get recognizedAt(): string | null { return this._recognizedAt; }

  get isOpen(): boolean { return this._status === 'open'; }
  get isRecognized(): boolean { return this._status === 'recognized'; }
}
