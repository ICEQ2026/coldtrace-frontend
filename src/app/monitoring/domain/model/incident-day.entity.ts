import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * @summary Represents an incident day in the monitoring bounded context.
 */
export class IncidentDay implements BaseEntity {
  private _id: number;
  private _label: string;
  private _normal: number;
  private _warning: number;
  private _critical: number;
  private _offline: number;

  constructor(day: { id: number; label: string; normal: number; warning: number; critical: number; offline: number }) {
    this._id = day.id;
    this._label = day.label;
    this._normal = day.normal;
    this._warning = day.warning;
    this._critical = day.critical;
    this._offline = day.offline;
  }

  get id(): number { return this._id; }
  get label(): string { return this._label; }
  get normal(): number { return this._normal; }
  get warning(): number { return this._warning; }
  get critical(): number { return this._critical; }
  get offline(): number { return this._offline; }
}
