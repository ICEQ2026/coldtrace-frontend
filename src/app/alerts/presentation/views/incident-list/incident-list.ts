import { Component, computed, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { AlertsStore } from '../../../application/alerts.store';
import { Incident } from '../../../domain/model/incident.entity';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [TranslateModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.css',
})
export class IncidentList implements OnInit {
  protected readonly alertsStore = inject(AlertsStore);
  private readonly identityStore = inject(IdentityAccessStore);
  protected readonly canResolveAlerts = computed(() => this.alertsStore.canResolveAlerts());
  protected readonly profileUserName = computed(() =>
    this.identityStore.currentUserNameFrom(this.identityStore.users()),
  );

  ngOnInit(): void {
    this.alertsStore.loadIncidents();
  }

  protected recognize(incident: Incident): void {
    if (!incident.isOpen || this.alertsStore.recognizingId() === incident.id) {
      return;
    }
    const userName = this.profileUserName();
    this.alertsStore.recognizeIncident(incident, userName).subscribe({
      error: () => undefined,
    });
  }

  protected statusLabelKey(incident: Incident): string {
    switch (incident.status) {
      case 'recognized': return 'alerts.incident-list.status-recognized';
      case 'closed': return 'alerts.incident-list.status-closed';
      default: return 'alerts.incident-list.status-open';
    }
  }

  protected severityIcon(incident: Incident): string {
    return incident.severity === 'critical' ? 'error' : 'warning';
  }

  protected typeLabelKey(incident: Incident): string {
    return `alerts.incident-list.type-${incident.type}`;
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
