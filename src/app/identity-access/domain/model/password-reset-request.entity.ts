import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { PasswordResetStatus } from './password-reset-status.enum';

export class PasswordResetRequest implements BaseEntity {
  constructor(
    private _id: number,
    private _userId: number,
    private _email: string,
    private _status: PasswordResetStatus,
    private _expiresAt: string
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

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }

  get status(): PasswordResetStatus {
    return this._status;
  }

  set status(value: PasswordResetStatus) {
    this._status = value;
  }

  get expiresAt(): string {
    return this._expiresAt;
  }

  set expiresAt(value: string) {
    this._expiresAt = value;
  }
}
