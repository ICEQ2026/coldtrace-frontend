import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * @summary Represents a temperature point in the monitoring bounded context.
 */
export class TemperaturePoint implements BaseEntity {
  private _id: number;
  private _label: string;
  private _temperature: number;
  private _ghost: number;
  private _maxLimit: number;
  private _minLimit: number;

  constructor(point: { id: number; label: string; temperature: number; ghost: number; maxLimit: number; minLimit: number }) {
    this._id = point.id;
    this._label = point.label;
    this._temperature = point.temperature;
    this._ghost = point.ghost;
    this._maxLimit = point.maxLimit;
    this._minLimit = point.minLimit;
  }

  get id(): number { return this._id; }
  get label(): string { return this._label; }
  get temperature(): number { return this._temperature; }
  get ghost(): number { return this._ghost; }
  get maxLimit(): number { return this._maxLimit; }
  get minLimit(): number { return this._minLimit; }
}
