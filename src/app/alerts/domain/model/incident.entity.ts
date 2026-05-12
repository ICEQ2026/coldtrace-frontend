import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type IncidentStatus = 'open' | 'recognized' | 'closed';
export type IncidentSeverity = 'warning' | 'critical';
export type IncidentType = 'temperature' | 'humidity' | 'connectivity' | 'other';
export type IncidentSource = 'initial-data' | 'sensor-reading' | 'manual';
export type IncidentReviewStatus = 'complete' | 'pending-review';
export type IncidentEscalationStatus = 'none' | 'pending-configuration' | 'escalated' | 'reviewed';

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
  private _conditionStable: boolean;
  private _correctiveAction: string | null;
  private _closureEvidence: string | null;
  private _closedBy: string | null;
  private _closedAt: string | null;
  private _conditionKey: string | null;
  private _source: IncidentSource;
  private _sourceReadingId: number | null;
  private _reviewStatus: IncidentReviewStatus;
  private _escalationStatus: IncidentEscalationStatus;
  private _escalationLevel: number;
  private _escalationPolicyMinutes: number | null;
  private _escalatedAt: string | null;
  private _escalatedTo: string | null;
  private _escalationReviewedBy: string | null;
  private _escalationReviewedAt: string | null;

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
    conditionStable: boolean;
    correctiveAction: string | null;
    closureEvidence: string | null;
    closedBy: string | null;
    closedAt: string | null;
    conditionKey: string | null;
    source: IncidentSource;
    sourceReadingId: number | null;
    reviewStatus: IncidentReviewStatus;
    escalationStatus: IncidentEscalationStatus;
    escalationLevel: number;
    escalationPolicyMinutes: number | null;
    escalatedAt: string | null;
    escalatedTo: string | null;
    escalationReviewedBy: string | null;
    escalationReviewedAt: string | null;
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
    this._conditionStable = incident.conditionStable;
    this._correctiveAction = incident.correctiveAction;
    this._closureEvidence = incident.closureEvidence;
    this._closedBy = incident.closedBy;
    this._closedAt = incident.closedAt;
    this._conditionKey = incident.conditionKey;
    this._source = incident.source;
    this._sourceReadingId = incident.sourceReadingId;
    this._reviewStatus = incident.reviewStatus;
    this._escalationStatus = incident.escalationStatus;
    this._escalationLevel = incident.escalationLevel;
    this._escalationPolicyMinutes = incident.escalationPolicyMinutes;
    this._escalatedAt = incident.escalatedAt;
    this._escalatedTo = incident.escalatedTo;
    this._escalationReviewedBy = incident.escalationReviewedBy;
    this._escalationReviewedAt = incident.escalationReviewedAt;
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
  get conditionStable(): boolean { return this._conditionStable; }
  get correctiveAction(): string | null { return this._correctiveAction; }
  get closureEvidence(): string | null { return this._closureEvidence; }
  get closedBy(): string | null { return this._closedBy; }
  get closedAt(): string | null { return this._closedAt; }
  get conditionKey(): string | null { return this._conditionKey; }
  get source(): IncidentSource { return this._source; }
  get sourceReadingId(): number | null { return this._sourceReadingId; }
  get reviewStatus(): IncidentReviewStatus { return this._reviewStatus; }
  get escalationStatus(): IncidentEscalationStatus { return this._escalationStatus; }
  get escalationLevel(): number { return this._escalationLevel; }
  get escalationPolicyMinutes(): number | null { return this._escalationPolicyMinutes; }
  get escalatedAt(): string | null { return this._escalatedAt; }
  get escalatedTo(): string | null { return this._escalatedTo; }
  get escalationReviewedBy(): string | null { return this._escalationReviewedBy; }
  get escalationReviewedAt(): string | null { return this._escalationReviewedAt; }

  get isOpen(): boolean { return this._status === 'open'; }
  get isRecognized(): boolean { return this._status === 'recognized'; }
  get isClosed(): boolean { return this._status === 'closed'; }
  get isConditionStable(): boolean { return this._conditionStable; }
  get isGenerated(): boolean { return this._source === 'sensor-reading'; }
  get isPendingReview(): boolean { return this._reviewStatus === 'pending-review'; }
  get isEscalated(): boolean { return this._escalationStatus === 'escalated'; }
  get isPendingEscalationConfiguration(): boolean {
    return this._escalationStatus === 'pending-configuration';
  }
}
