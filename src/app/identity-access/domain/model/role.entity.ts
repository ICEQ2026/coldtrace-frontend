import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { Permission } from './permission.entity';
import { RoleName } from './role-name.enum';

export class Role implements BaseEntity {
  constructor(
    private _id: number,
    private _name: RoleName,
    private _label: string,
    private _permissions: Permission[],
  ) {}

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get name(): RoleName {
    return this._name;
  }

  set name(value: RoleName) {
    this._name = value;
  }

  get label(): string {
    return this._label;
  }

  set label(value: string) {
    this._label = value;
  }

  get permissions(): Permission[] {
    return this._permissions;
  }

  set permissions(value: Permission[]) {
    this._permissions = value;
  }
}
