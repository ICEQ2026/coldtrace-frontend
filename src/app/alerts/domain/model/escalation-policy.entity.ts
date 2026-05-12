import { Incident, IncidentSeverity } from './incident.entity';

export class EscalationPolicy {
  constructor(
    private _severity: IncidentSeverity,
    private _waitingMinutes: number,
    private _level: number,
    private _targetKey: string,
  ) {}

  get severity(): IncidentSeverity {
    return this._severity;
  }
  get waitingMinutes(): number {
    return this._waitingMinutes;
  }
  get level(): number {
    return this._level;
  }
  get targetKey(): string {
    return this._targetKey;
  }

  appliesTo(incident: Incident): boolean {
    return incident.severity === this._severity && incident.type !== 'other';
  }
}
