import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AlertsStore } from '../../../application/alerts.store';
import { Incident } from '../../../domain/model/incident.entity';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { DashboardShell } from '../../../../shared/presentation/components/dashboard-shell/dashboard-shell';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [TranslateModule, MatIconModule, MatProgressSpinnerModule, DashboardShell],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.css',
})
export class IncidentList implements OnInit {
  protected readonly alertsStore = inject(AlertsStore);
  protected readonly identityStore = inject(IdentityAccessStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activeOrganizationName = computed(() =>
    this.identityStore.currentOrganizationNameFrom(
      this.identityStore.users(),
      this.identityStore.organizations(),
    ),
  );
  protected readonly profileUserName = computed(() =>
    this.identityStore.currentUserNameFrom(this.identityStore.users()),
  );
  protected readonly profileRoleLabelKey = computed(() =>
    this.identityStore.currentRoleLabelKeyFrom(
      this.identityStore.users(),
      this.identityStore.roles(),
    ),
  );
  protected readonly canManageAccess = computed(() =>
    this.identityStore.canManageAccess(
      this.identityStore.users(),
      this.identityStore.roles(),
    ),
  );
  protected readonly assetIssuesCount = computed(() => 0);
  protected readonly canResolveAlerts = computed(() => this.alertsStore.canResolveAlerts());

  ngOnInit(): void {
    this.identityStore.loadUsers();
    this.identityStore.loadOrganizations();
    this.identityStore.loadRoles();
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

  protected logout(): void {
    this.identityStore.clearCurrentUser();
    void this.router.navigate(['/identity-access/sign-in']);
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