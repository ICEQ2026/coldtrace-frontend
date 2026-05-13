import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { TechnicalServiceStatus } from './technical-service-status.enum';

/**
 * @summary Represents a technical service request in the maintenance management bounded context.
 */
export class TechnicalServiceRequest implements BaseEntity {
  constructor(
    private readonly _id: number,
    private readonly _organizationId: number,
    private readonly _uuid: string,
    private readonly _assetId: number,
    private readonly _priority: string,
    private readonly _issueDescription: string,
    private readonly _requestedDate: string,
    private readonly _status: TechnicalServiceStatus,
    private readonly _interventionNotes: string | null,
    private readonly _resultNotes: string | null,
    private readonly _functionalTestPassed: boolean | null,
    private readonly _closedAt: string | null,
  ) {}

  get id(): number {
    return this._id;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get uuid(): string {
    return this._uuid;
  }

  get assetId(): number {
    return this._assetId;
  }

  get priority(): string {
    return this._priority;
  }

  get issueDescription(): string {
    return this._issueDescription;
  }

  get requestedDate(): string {
    return this._requestedDate;
  }

  get status(): TechnicalServiceStatus {
    return this._status;
  }

  get interventionNotes(): string | null {
    return this._interventionNotes;
  }

  get resultNotes(): string | null {
    return this._resultNotes;
  }

  get functionalTestPassed(): boolean | null {
    return this._functionalTestPassed;
  }

  get closedAt(): string | null {
    return this._closedAt;
  }
}
