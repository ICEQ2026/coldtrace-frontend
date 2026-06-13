import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { IdentityAccessStore } from '../../../application/identity-access.store';
import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';
import { Organization } from '../../../domain/model/organization.entity';
import { Role } from '../../../domain/model/role.entity';
import { User } from '../../../domain/model/user.entity';
import { IdentityAccessApi } from '../../../infrastructure/identity-access-api';

type RolePermissionFeedback = 'idle' | 'saved' | 'server-error';

/**
 * @summary Presents the role permission form user interface in the identity access bounded context.
 */
@Component({
  selector: 'app-role-permission-form',
  imports: [MatButton, TranslatePipe],
  templateUrl: './role-permission-form.html',
  styleUrl: '../user-access-list/user-access-list.css',
})
export class RolePermissionForm implements OnInit {
  protected readonly identityAccessStore = inject(IdentityAccessStore);
  protected readonly assetManagementStore = inject(AssetManagementStore);
  private readonly identityAccessApi = inject(IdentityAccessApi);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly savingRoleId = signal<number | null>(null);
  protected readonly feedback = signal<RolePermissionFeedback>('idle');
  protected readonly roles = signal<Role[]>([]);
  protected readonly users = signal<User[]>([]);
  protected readonly organizations = signal<Organization[]>([]);

  protected readonly activeOrganizationName = computed(() => {
    return this.identityAccessStore.currentOrganizationNameFrom(this.users(), this.organizations());
  });
  protected readonly profileUserName = computed(() => this.identityAccessStore.currentUserNameFrom(this.users()));
  protected readonly profileRoleLabelKey = computed(
    () => this.identityAccessStore.currentRoleLabelKeyFrom(this.users(), this.roles())
  );
  protected readonly canManageAccess = computed(
    () => this.identityAccessStore.canManageRolePermissions(this.users(), this.roles())
  );
  protected readonly assetIssueCount = computed(() => {
    return this.assetManagementStore.assetIssueCountFor(this.activeOrganizationId());
  });

  /**
   * @summary Initializes the role permission form view state.
   */
  ngOnInit(): void {
    this.loadRoles();
  }

  protected loadRoles(): void {
    this.loading.set(true);
    this.feedback.set('idle');
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
          this.identityAccessStore.setCurrentContextFrom(users, roles, organizations);
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected roleLabelKey(role?: Role): string {
    if (!role) {
      return 'roles-permissions.roles.unassigned';
    }

    return `roles-permissions.roles.${role.name}`;
  }

  protected isPermissionSelected(role: Role, permissionKey: string): boolean {
    return this.identityAccessStore.isPermissionSelected(role, permissionKey);
  }

  protected isPermissionToggleDisabled(role: Role, permissionKey: string): boolean {
    return (
      !this.canManageAccess() ||
      this.savingRoleId() === role.id ||
      this.identityAccessStore.isPermissionToggleDisabled(role, permissionKey)
    );
  }

  protected toggleRolePermission(role: Role, permissionKey: string, checked: boolean): void {
    if (!this.canManageAccess()) {
      return;
    }

    this.savingRoleId.set(role.id);
    this.feedback.set('idle');
    this.identityAccessStore
      .toggleRolePermission(role, permissionKey, checked)
      .pipe(finalize(() => this.savingRoleId.set(null)))
      .subscribe({
        next: (savedRole) => {
          this.roles.update((roles) =>
            roles.map((currentRole) => (currentRole.id === savedRole.id ? savedRole : currentRole)),
          );
          this.feedback.set('saved');
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected logout(): void {
    this.identityAccessStore.clearCurrentUser();
    void this.router.navigate(['/identity-access/sign-in']);
  }

  private activeOrganizationId(): number | null {
    return this.identityAccessStore.currentOrganizationIdFrom(this.users());
  }
}
