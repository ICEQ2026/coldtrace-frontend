import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Notification } from '../domain/model/notification.entity';
import { NotificationResource, NotificationsResponse } from './notifications-response';

export class NotificationAssembler implements BaseAssembler<Notification, NotificationResource, NotificationsResponse> {
  toEntityFromResource(resource: NotificationResource): Notification {
    return new Notification(
      Number(resource.id),
      resource.organizationId,
      resource.incidentId,
      resource.assetName,
      resource.channel,
      resource.recipient,
      resource.message,
      resource.status,
      resource.createdAt,
      resource.deliveredAt ?? null,
      resource.failureReason ?? null,
    );
  }

  toResourceFromEntity(entity: Notification): NotificationResource {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      incidentId: entity.incidentId,
      assetName: entity.assetName,
      channel: entity.channel,
      recipient: entity.recipient,
      message: entity.message,
      status: entity.status,
      createdAt: entity.createdAt,
      deliveredAt: entity.deliveredAt,
      failureReason: entity.failureReason,
    };
  }

  toEntitiesFromResponse(response: NotificationsResponse): Notification[] {
    return response.notifications.map((notification) => this.toEntityFromResource(notification));
  }
}
