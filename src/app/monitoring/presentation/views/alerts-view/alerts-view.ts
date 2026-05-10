import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { MonitoringStore } from '../../../application/monitoring.store';
import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { IdentityAccessApi } from '../../../../identity-access/infrastructure/identity-access-api';
import { DashboardShell } from '../../../../shared/presentation/componentes/dashboard-shell/dashboard-shell';
import { Organization } from '../../../../identity-access/domain/model/organization.entity';
import { Role } from '../../../../identity-access/domain/model/role.entity';
import { User } from '../../../../identity-access/domain/model/user.entity';

@Component({
  selector: 'app-alerts-view',
  imports: [DashboardShell, MatIconButton, MatIcon, MatProgressSpinner, TranslatePipe],
  templateUrl: './alerts-view.html',
  styleUrl: './alerts-view.css',
})
export class AlertsView implements OnInit {
  protected readonly monitoringStore = inject(MonitoringStore);
  protected readonly assetStore = inject(AssetManagementStore);
  protected readonly identityStore = inject(IdentityAccessStore);
  private readonly identityApi = inject(IdentityAccessApi);
  private readonly router = inject(Router);

  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly identityLoading = signal(false);

  protected readonly activeOrganizationName = computed(() =>
    this.identityStore.currentOrganizationNameFrom(this.users(), this.organizations()),
  );
  protected readonly profileUserName = computed(() =>
    this.identityStore.currentUserNameFrom(this.users()),
  );
  protected readonly profileRoleLabelKey = computed(() =>
    this.identityStore.currentRoleLabelKeyFrom(this.users(), this.roles()),
  );
  protected readonly canManageAccess = computed(() =>
    this.identityStore.canManageAccess(this.users(), this.roles()),
  );

  ngOnInit(): void {
    // Cargar datos
    this.monitoringStore.loadReadings();
    this.assetStore.loadAssets();

    // Cargar identidad
    this.identityLoading.set(true);
    forkJoin({
      users: this.identityApi.getUsers(),
      roles: this.identityApi.getRoles(),
      organizations: this.identityApi.getOrganizations(),
    })
      .pipe(finalize(() => this.identityLoading.set(false)))
      .subscribe({
        next: ({ users, roles, organizations }) => {
          this.users.set(users);
          this.roles.set(roles);
          this.organizations.set(organizations);
          this.identityStore.setCurrentRoleFrom(users, roles);
          this.identityStore.setCurrentOrganizationFrom(users, organizations);
          this.identityStore.initializeRolePermissions(roles);
        },
      });
  }

  getAssetName(assetId: number): string {
    return this.assetStore.assets().find((a) => a.id === assetId)?.name ?? `Asset #${assetId}`;
  }

  goBack(): void {
    this.router.navigate(['/monitoring/dashboard']).then();
  }

  logout(): void {
    this.identityStore.clearCurrentUser();
    void this.router.navigate(['/identity-access/sign-in']);
  }
}
