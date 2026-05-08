import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { PermissionAction } from './permission-action.enum';

export class Permission implements BaseEntity {
  constructor(
    private _id: number,
    private _resource: string,
    private _action: PermissionAction,
    private _description: string
  ) {}

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get resource(): string {
    return this._resource;
  }

  set resource(value: string) {
    this._resource = value;
  }

  get action(): PermissionAction {
    return this._action;
  }

  set action(value: PermissionAction) {
    this._action = value;
  }

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }
}
