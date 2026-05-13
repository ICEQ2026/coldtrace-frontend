import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { AlertsStore } from '../../../application/alerts.store';
import { Incident } from '../../../domain/model/incident.entity';
import { Notification } from '../../../domain/model/notification.entity';

/**
 * @summary Presents the notification list user interface in the alerts bounded context.
 */
@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [TranslateModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
})
export class NotificationList implements OnInit {
  protected readonly alertsStore = inject(AlertsStore);
  private readonly identityAccessStore = inject(IdentityAccessStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedbackDismissDelayMs = 3000;
  private feedbackDismissTimeoutId: number | null = null;
  protected readonly notifications = computed(() => {
    return [...this.alertsStore.activeNotifications()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });
  protected readonly canAttendNotifications = computed(() => this.alertsStore.canResolveAlerts());

  constructor() {
    this.destroyRef.onDestroy(() => this.clearFeedbackDismissTimeout());
  }

  /**
   * @summary Initializes the notification list view state.
   */
  ngOnInit(): void {
    this.alertsStore.clearFeedback();
    this.alertsStore.loadIncidents();
  }

  protected notificationChannelIcon(notification: Notification): string {
    switch (notification.channel) {
      case 'email':
        return 'mail';
      case 'sms':
        return 'sms';
      default:
        return 'notifications';
    }
  }

  protected notificationChannelLabelKey(notification: Notification): string {
    return `alerts.notification-list.channel-${notification.channel}`;
  }

  protected notificationStatusLabelKey(notification: Notification): string {
    return `alerts.notification-list.status-${notification.status}`;
  }

  protected incidentForNotification(notification: Notification): Incident | null {
    return (
      this.alertsStore.incidents().find((incident) => incident.id === notification.incidentId) ??
      null
    );
  }

  protected escalationLabelKey(incident: Incident): string {
    return `alerts.notification-list.escalation-${incident.escalationStatus}`;
  }

  protected severityLabelKey(incident: Incident): string {
    return `alerts.notification-list.severity-${incident.severity}`;
  }

  protected isAttending(notification: Notification): boolean {
    const incident = this.incidentForNotification(notification);

    return Boolean(incident && this.alertsStore.recognizingId() === incident.id);
  }

  protected attendNotification(notification: Notification): void {
    const incident = this.incidentForNotification(notification);

    if (!incident || !incident.isOpen) {
      return;
    }

    if (!this.canAttendNotifications()) {
      this.showTimedFeedback('alerts.notification-list.feedback-access-denied');
      return;
    }

    const responsibleUserName = this.identityAccessStore.currentUserNameFrom(
      this.identityAccessStore.users(),
    );

    this.alertsStore.recognizeIncident(incident, responsibleUserName).subscribe({
      next: () => this.showTimedFeedback('alerts.notification-list.feedback-attended'),
      error: () => this.showTimedFeedback('alerts.notification-list.feedback-error'),
    });
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

  private showTimedFeedback(feedbackKey: string): void {
    this.clearFeedbackDismissTimeout();
    this.alertsStore.setFeedback(feedbackKey);
    this.feedbackDismissTimeoutId = window.setTimeout(() => {
      this.alertsStore.clearFeedback();
      this.feedbackDismissTimeoutId = null;
    }, this.feedbackDismissDelayMs);
  }

  private clearFeedbackDismissTimeout(): void {
    if (this.feedbackDismissTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.feedbackDismissTimeoutId);
    this.feedbackDismissTimeoutId = null;
  }
}
