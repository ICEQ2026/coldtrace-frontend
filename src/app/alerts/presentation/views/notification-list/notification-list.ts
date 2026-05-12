import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AlertsStore } from '../../../application/alerts.store';
import { Notification } from '../../../domain/model/notification.entity';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [TranslateModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
})
export class NotificationList implements OnInit {
  protected readonly alertsStore = inject(AlertsStore);

  ngOnInit(): void {
    this.alertsStore.loadIncidents();
  }

  protected notificationChannelIcon(notification: Notification): string {
    switch (notification.channel) {
      case 'email': return 'mail';
      case 'sms': return 'sms';
      default: return 'notifications';
    }
  }

  protected notificationChannelLabelKey(notification: Notification): string {
    return `alerts.notification-list.channel-${notification.channel}`;
  }

  protected notificationStatusLabelKey(notification: Notification): string {
    return `alerts.notification-list.status-${notification.status}`;
  }

  protected formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  }
}
