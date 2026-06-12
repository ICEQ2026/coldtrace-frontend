import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * @summary Represents an operational location in the asset management bounded context.
 */
export class Location implements BaseEntity {
  constructor(
    private readonly _id: number,
    private readonly _organizationId: number,
    private readonly _name: string,
    private readonly _type: string,
    private readonly _address: string,
    private readonly _description: string,
    private readonly _status: string,
  ) {}

  get id(): number {
    return this._id;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get name(): string {
    return this._name;
  }

  get type(): string {
    return this._type;
  }

  get address(): string {
    return this._address;
  }

  get description(): string {
    return this._description;
  }

  get status(): string {
    return this._status;
  }
}
