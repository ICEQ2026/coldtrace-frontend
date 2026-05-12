import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { NotificationChannel } from '../domain/model/notification-channel.enum';
import { NotificationStatus } from '../domain/model/notification-status.enum';

export interface NotificationResource extends BaseResource {
  organizationId: number;
  incidentId: number;
  assetName: string;
  channel: NotificationChannel;
  recipient: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  deliveredAt?: string | null;
  failureReason?: string | null;
}

export interface NotificationsResponse extends BaseResponse {
  notifications: NotificationResource[];
}
