import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class Organization implements BaseEntity {
  constructor(
    private _id: number,
    private _legalName: string,
    private _commercialName: string,
    private _taxId: string,
    private _contactEmail: string,
  ) {}

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get legalName(): string {
    return this._legalName;
  }

  set legalName(value: string) {
    this._legalName = value;
  }

  get commercialName(): string {
    return this._commercialName;
  }

  set commercialName(value: string) {
    this._commercialName = value;
  }

  get taxId(): string {
    return this._taxId;
  }

  set taxId(value: string) {
    this._taxId = value;
  }

  get contactEmail(): string {
    return this._contactEmail;
  }

  set contactEmail(value: string) {
    this._contactEmail = value;
  }
}
