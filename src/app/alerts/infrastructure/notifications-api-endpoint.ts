import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Notification } from '../domain/model/notification.entity';
import { NotificationAssembler } from './notification-assembler';
import { NotificationResource, NotificationsResponse } from './notifications-response';

export class NotificationsApiEndpoint extends BaseApiEndpoint<
  Notification,
  NotificationResource,
  NotificationsResponse,
  NotificationAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.platformProviderApiBaseUrl + environment.platformProviderNotificationsEndpointPath,
      new NotificationAssembler(),
    );
  }
}
