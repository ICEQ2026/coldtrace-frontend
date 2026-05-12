import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { NotificationChannel } from './notification-channel.enum';
import { NotificationStatus } from './notification-status.enum';

export class Notification implements BaseEntity {
  constructor(
    private _id: number,
    private _organizationId: number,
    private _incidentId: number,
    private _assetName: string,
    private _channel: NotificationChannel,
    private _recipient: string,
    private _message: string,
    private _status: NotificationStatus,
    private _createdAt: string,
    private _deliveredAt: string | null,
    private _failureReason: string | null,
  ) {}

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get incidentId(): number {
    return this._incidentId;
  }

  get assetName(): string {
    return this._assetName;
  }

  get channel(): NotificationChannel {
    return this._channel;
  }

  get recipient(): string {
    return this._recipient;
  }

  get message(): string {
    return this._message;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get deliveredAt(): string | null {
    return this._deliveredAt;
  }

  get failureReason(): string | null {
    return this._failureReason;
  }

  get isPending(): boolean {
    return this._status === NotificationStatus.Pending;
  }

  get isSent(): boolean {
    return this._status === NotificationStatus.Sent;
  }

  get isFailed(): boolean {
    return this._status === NotificationStatus.Failed;
  }
}
