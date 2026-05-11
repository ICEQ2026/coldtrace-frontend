import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { IdentityAccessStore } from '../../../application/identity-access.store';
import { Organization } from '../../../domain/model/organization.entity';
import { Role } from '../../../domain/model/role.entity';
import { User } from '../../../domain/model/user.entity';
import { IdentityAccessApi } from '../../../infrastructure/identity-access-api';
import { DashboardShell } from '../../../../shared/presentation/components/dashboard-shell/dashboard-shell';
import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';

@Component({
  selector: 'app-dashboard-placeholder',
  imports: [DashboardShell, TranslatePipe],
  templateUrl: './dashboard-placeholder.html',
  styleUrl: './dashboard-placeholder.css',
})
export class DashboardPlaceholder implements OnInit {
  protected readonly identityAccessStore = inject(IdentityAccessStore);
  protected readonly assetManagementStore = inject(AssetManagementStore);
  private readonly identityAccessApi = inject(IdentityAccessApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly pageTitleKey = signal('roles-permissions.main-page-title');
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly organizations = signal<Organization[]>([]);

  protected readonly activeOrganizationName = computed(() => {
    return this.identityAccessStore.currentOrganizationNameFrom(this.users(), this.organizations());
  });
  protected readonly profileUserName = computed(() => this.identityAccessStore.currentUserNameFrom(this.users()));
  protected readonly profileRoleLabelKey = computed(
    () => this.identityAccessStore.currentRoleLabelKeyFrom(this.users(), this.roles())
  );
  protected readonly canManageAccess = computed(
    () => this.identityAccessStore.canManageAccess(this.users(), this.roles())
  );
  protected readonly assetIssueCount = computed(() => {
    return this.assetManagementStore.assetIssueCountFor(this.activeOrganizationId());
  });

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.pageTitleKey.set(data['pageTitleKey'] ?? 'roles-permissions.main-page-title');
    });
    this.loadShellData();
  }

  protected logout(): void {
    this.identityAccessStore.clearCurrentUser();
    void this.router.navigate(['/identity-access/sign-in']);
  }

  private loadShellData(): void {
    this.loading.set(true);
    this.assetManagementStore.loadAssets();

    forkJoin({
      users: this.identityAccessApi.getUsers(),
      roles: this.identityAccessApi.getRoles(),
      organizations: this.identityAccessApi.getOrganizations(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ users, roles, organizations }) => {
          this.users.set(users);
          this.roles.set(roles);
          this.organizations.set(organizations);
          this.identityAccessStore.setCurrentRoleFrom(users, roles);
          this.identityAccessStore.setCurrentOrganizationFrom(users, organizations);
          this.identityAccessStore.initializeRolePermissions(roles);
        },
        error: () => {},
      });
  }

  private activeOrganizationId(): number | null {
    return this.identityAccessStore.currentOrganizationIdFrom(this.users());
  }
}
