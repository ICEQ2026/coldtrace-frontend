import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * @summary Represents a maintenance task in the monitoring bounded context.
 */
export class MaintenanceTask implements BaseEntity {
  private _id: number;
  private _label: string;
  private _icon: string;
  private _status: 'to-do' | 'doing' | 'done';

  constructor(task: { id: number; label: string; icon: string; status: 'to-do' | 'doing' | 'done' }) {
    this._id = task.id;
    this._label = task.label;
    this._icon = task.icon;
    this._status = task.status;
  }

  get id(): number { return this._id; }
  get label(): string { return this._label; }
  get icon(): string { return this._icon; }
  get status(): 'to-do' | 'doing' | 'done' { return this._status; }
}
