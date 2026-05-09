import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class User implements BaseEntity {
  constructor(
    private _id: number,
    private _firstName: string,
    private _lastName: string,
    private _email: string,
    private _organizationId: number,
    private _roleId: number,
    private _uuid: string = `USR-${_id}`,
    private _organizationUserId: number = _id,
  ) {}

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get firstName(): string {
    return this._firstName;
  }

  set firstName(value: string) {
    this._firstName = value;
  }

  get lastName(): string {
    return this._lastName;
  }

  set lastName(value: string) {
    this._lastName = value;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  set organizationId(value: number) {
    this._organizationId = value;
  }

  get roleId(): number {
    return this._roleId;
  }

  set roleId(value: number) {
    this._roleId = value;
  }

  get uuid(): string {
    return this._uuid;
  }

  set uuid(value: string) {
    this._uuid = value;
  }

  get organizationUserId(): number {
    return this._organizationUserId;
  }

  set organizationUserId(value: number) {
    this._organizationUserId = value;
  }
}
