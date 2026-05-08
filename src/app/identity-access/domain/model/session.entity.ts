import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class Session implements BaseEntity {
  constructor(
    private _id: number,
    private _userId: number,
    private _startedAt: string,
    private _expiresAt: string,
    private _active: boolean
  ) {}

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get userId(): number {
    return this._userId;
  }

  set userId(value: number) {
    this._userId = value;
  }

  get startedAt(): string {
    return this._startedAt;
  }

  set startedAt(value: string) {
    this._startedAt = value;
  }

  get expiresAt(): string {
    return this._expiresAt;
  }

  set expiresAt(value: string) {
    this._expiresAt = value;
  }

  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    this._active = value;
  }
}
