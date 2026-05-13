import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * @summary Represents a recent alert in the monitoring bounded context.
 */
export class RecentAlert implements BaseEntity {
  private _id: number;
  private _assetName: string;
  private _type: string;
  private _value: string;
  private _date: string;
  private _status: 'Acknowledged' | 'Unacknowledged';
  private _severity: 'warning' | 'critical' | 'info';
  private _icon: string;

  constructor(alert: { id: number; assetName: string; type: string; value: string; date: string; status: 'Acknowledged' | 'Unacknowledged'; severity: 'warning' | 'critical' | 'info'; icon: string }) {
    this._id = alert.id;
    this._assetName = alert.assetName;
    this._type = alert.type;
    this._value = alert.value;
    this._date = alert.date;
    this._status = alert.status;
    this._severity = alert.severity;
    this._icon = alert.icon;
  }

  get id(): number { return this._id; }
  get assetName(): string { return this._assetName; }
  get type(): string { return this._type; }
  get value(): string { return this._value; }
  get date(): string { return this._date; }
  get status(): 'Acknowledged' | 'Unacknowledged' { return this._status; }
  get severity(): 'warning' | 'critical' | 'info' { return this._severity; }
  get icon(): string { return this._icon; }
}
