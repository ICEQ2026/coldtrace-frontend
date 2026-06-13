import { computed, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { Organization } from '../domain/model/organization.entity';
import { PermissionAction } from '../domain/model/permission-action.enum';
import { Permission } from '../domain/model/permission.entity';
import { RoleName } from '../domain/model/role-name.enum';
import { Role } from '../domain/model/role.entity';
import { User } from '../domain/model/user.entity';
import { IdentityAccessApi } from '../infrastructure/identity-access-api';

interface PermissionDefinition {
  key: string;
  resource: string;
  action: PermissionAction;
}

/**
 * @summary Manages identity access state and workflows for presentation components.
 */
@Injectable({ providedIn: 'root' })
export class IdentityAccessStore {
  private readonly usersSignal = signal<User[]>([]);
  private readonly organizationsSignal = signal<Organization[]>([]);
  private readonly rolesSignal = signal<Role[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly currentUserIdSignal = signal<number | null>(null);
  private readonly currentUserNameSignal = signal<string>('');
  private readonly currentRoleLabelKeySignal = signal<string>('');
  private readonly currentOrganizationNameSignal = signal<string>('');
  private readonly rolePermissionKeysByRoleIdSignal = signal<Record<number, string[]>>({});
  readonly manageAdministratorsPermissionKey = 'roles-permissions.permissions.manage-administrators';
  readonly manageUsersPermissionKey = 'roles-permissions.permissions.manage-users';
  readonly manageAssetsPermissionKey = 'roles-permissions.permissions.manage-assets';
  readonly viewReportsPermissionKey = 'roles-permissions.permissions.view-reports';
  readonly resolveAlertsPermissionKey = 'roles-permissions.permissions.resolve-alerts';
  readonly monitorAssetsPermissionKey = 'roles-permissions.permissions.monitor-assets';
  readonly readOnlyPermissionKey = 'roles-permissions.permissions.read-only';
  private readonly permissionDefinitions: PermissionDefinition[] = [
    {
      key: this.manageAdministratorsPermissionKey,
      resource: 'administrators',
      action: PermissionAction.Manage,
    },
    {
      key: this.manageUsersPermissionKey,
      resource: 'users',
      action: PermissionAction.Manage,
    },
    {
      key: this.manageAssetsPermissionKey,
      resource: 'assets',
      action: PermissionAction.Manage,
    },
    {
      key: this.viewReportsPermissionKey,
      resource: 'reports',
      action: PermissionAction.View,
    },
    {
      key: this.resolveAlertsPermissionKey,
      resource: 'alerts',
      action: PermissionAction.Update,
    },
    {
      key: this.monitorAssetsPermissionKey,
      resource: 'monitoring',
      action: PermissionAction.View,
    },
    {
      key: this.readOnlyPermissionKey,
      resource: 'workspace',
      action: PermissionAction.View,
    },
  ];
  readonly availablePermissionKeys = this.permissionDefinitions.map((definition) => definition.key);

  /**
   * @summary Frontend permission matrix used until real backend authorization exists.
   */
  private readonly defaultPermissionKeysByRoleName: Record<RoleName, string[]> = {
    [RoleName.SuperAdministrator]: [...this.availablePermissionKeys],
    [RoleName.Administrator]: this.availablePermissionKeys.filter(
      (permissionKey) => permissionKey !== this.manageAdministratorsPermissionKey,
    ),
    [RoleName.OperationsManager]: [
      this.manageAssetsPermissionKey,
      this.resolveAlertsPermissionKey,
      this.viewReportsPermissionKey,
    ],
    [RoleName.Operator]: [
      this.monitorAssetsPermissionKey,
      this.resolveAlertsPermissionKey,
    ],
    [RoleName.Auditor]: [
      this.viewReportsPermissionKey,
      this.readOnlyPermissionKey,
    ],
  };

  readonly users = this.usersSignal.asReadonly();
  readonly organizations = this.organizationsSignal.asReadonly();
  readonly roles = this.rolesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly currentUserId = this.currentUserIdSignal.asReadonly();
  readonly currentUserName = this.currentUserNameSignal.asReadonly();
  readonly currentRoleLabelKey = this.currentRoleLabelKeySignal.asReadonly();
  readonly currentOrganizationName = this.currentOrganizationNameSignal.asReadonly();
  readonly rolePermissionKeysByRoleId = this.rolePermissionKeysByRoleIdSignal.asReadonly();
  readonly userCount = computed(() => this.users().length);

  constructor(private identityAccessApi: IdentityAccessApi) {}

  /**
   * @summary Loads users data into local state.
   */
  loadUsers(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.identityAccessApi.getUsers().subscribe({
      next: (users) => {
        this.usersSignal.set(users);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  /**
   * @summary Loads organizations data into local state.
   */
  loadOrganizations(): void {
    this.identityAccessApi.getOrganizations().subscribe({
      next: (organizations) => this.organizationsSignal.set(organizations),
      error: (error) => this.errorSignal.set(error.message),
    });
  }

  /**
   * @summary Loads roles data into local state.
   */
  loadRoles(): void {
    this.identityAccessApi.getRoles().subscribe({
      next: (roles) => {
        this.rolesSignal.set(roles);
        this.initializeRolePermissions(roles);
      },
      error: (error) => this.errorSignal.set(error.message),
    });
  }

  /**
   * @summary Stores the active user identifier and display name.
   */
  setCurrentUser(user: User): void {
    this.currentUserIdSignal.set(user.id);
    this.currentUserNameSignal.set(user.fullName);
  }

  /**
   * @summary Stores the translation key for the active user role.
   */
  setCurrentRole(role: Role): void {
    const roleLabelKey = this.roleLabelKey(role);
    this.currentRoleLabelKeySignal.set(roleLabelKey);
  }

  /**
   * @summary Resolves and stores the active role from loaded users and roles.
   */
  setCurrentRoleFrom(users: User[], roles: Role[]): void {
    const user = this.currentUserFrom(users);
    const role = roles.find(current => current.id === user?.roleId);

    if (role) {
      this.setCurrentRole(role);
    }
  }

  /**
   * @summary Stores the active organization display name.
   */
  setCurrentOrganization(organization: Organization): void {
    this.currentOrganizationNameSignal.set(organization.commercialName);
  }

  /**
   * @summary Resolves and stores the active organization from loaded data.
   */
  setCurrentOrganizationFrom(users: User[], organizations: Organization[]): void {
    const organizationId = this.currentOrganizationIdFrom(users);
    const organization = organizations.find(current => current.id === organizationId);

    if (organization) {
      this.setCurrentOrganization(organization);
    }
  }

  /**
   * @summary Resolves and stores the current role, organization, and editable permissions.
   */
  setCurrentContextFrom(users: User[], roles: Role[], organizations: Organization[]): void {
    this.setCurrentRoleFrom(users, roles);
    this.setCurrentOrganizationFrom(users, organizations);
    this.initializeRolePermissions(roles);
  }

  /**
   * @summary Clears the current user, role, and organization selection state.
   */
  clearCurrentUser(): void {
    this.currentUserIdSignal.set(null);
    this.currentUserNameSignal.set('');
    this.currentRoleLabelKeySignal.set('');
    this.currentOrganizationNameSignal.set('');
  }

  /**
   * @summary Resolves the current user with the seeded demo fallback.
   */
  currentUserFrom(users: User[]): User | undefined {
    const currentUserId = this.currentUserId();

    if (currentUserId) {
      const currentUser = users.find(user => user.id === currentUserId);

      if (currentUser) {
        return currentUser;
      }
    }

    // The demo falls back to the seeded first user when no session service exists yet.
    return users.find(user => user.id === 1) ?? users[0];
  }

  /**
   * @summary Resolves the organization id assigned to the current user.
   */
  currentOrganizationIdFrom(users: User[]): number | null {
    return this.currentUserFrom(users)?.organizationId ?? null;
  }

  /**
   * @summary Resolves the display name for the current user organization.
   */
  currentOrganizationNameFrom(users: User[], organizations: Organization[]): string {
    const organizationId = this.currentOrganizationIdFrom(users);
    const organization = organizations.find(current => current.id === organizationId);
    return organization?.commercialName || this.currentOrganizationName() || 'ColdTrace';
  }

  /**
   * @summary Resolves the display name for the current user.
   */
  currentUserNameFrom(users: User[]): string {
    return this.currentUserFrom(users)?.fullName || this.currentUserName() || 'ColdTrace';
  }

  /**
   * @summary Resolves the translation key for the current user role.
   */
  currentRoleLabelKeyFrom(users: User[], roles: Role[]): string {
    const user = this.currentUserFrom(users);
    const role = roles.find(current => current.id === user?.roleId);
    return role ? this.roleLabelKey(role) : this.currentRoleLabelKey() || 'roles-permissions.roles.unassigned';
  }

  /**
   * @summary Initializes editable permission keys for loaded roles.
   */
  initializeRolePermissions(roles: Role[]): void {
    this.rolePermissionKeysByRoleIdSignal.set(this.permissionStateFromRoles(roles));
  }

  /**
   * @summary Returns permission translation keys assigned to a role.
   */
  permissionKeysForRole(role?: Role): string[] {
    if (!role) {
      return ['roles-permissions.permissions.none'];
    }

    const permissionKeys =
      this.rolePermissionKeysByRoleIdSignal()[role.id] ??
      this.permissionKeysFromRole(role);

    return permissionKeys.length ? permissionKeys : ['roles-permissions.permissions.none'];
  }

  /**
   * @summary Checks whether a role currently includes a permission.
   */
  isPermissionSelected(role: Role, permissionKey: string): boolean {
    return this.permissionKeysForRole(role).includes(permissionKey);
  }

  /**
   * @summary Checks whether a role is an organization administrator.
   */
  isAdministratorRole(role?: Role): boolean {
    return role?.name === RoleName.Administrator;
  }

  /**
   * @summary Checks whether a role is the super administrator.
   */
  isSuperAdministratorRole(role?: Role): boolean {
    return role?.name === RoleName.SuperAdministrator;
  }

  /**
   * @summary Resolves the current user role from loaded roles.
   */
  currentRoleFrom(users: User[], roles: Role[]): Role | undefined {
    const user = this.currentUserFrom(users);
    return roles.find(currentRole => currentRole.id === user?.roleId);
  }

  /**
   * @summary Checks whether the current user can manage access records.
   */
  canManageAccess(users: User[], roles: Role[]): boolean {
    return this.canManageRolePermissions(users, roles);
  }

  /**
   * @summary Checks whether the current user can update role permission matrices.
   */
  canManageRolePermissions(users: User[], roles: Role[]): boolean {
    const role = this.currentRoleFrom(users, roles);
    return this.isSuperAdministratorRole(role) || this.isAdministratorRole(role);
  }

  /**
   * @summary Checks whether the current user can create users or assign operational roles.
   */
  canManageUsers(users: User[], roles: Role[]): boolean {
    return this.permissionKeysForRole(this.currentRoleFrom(users, roles)).includes(
      this.manageUsersPermissionKey,
    );
  }

  /**
   * @summary Checks whether the current user can manage operational asset records.
   */
  canManageAssets(users: User[], roles: Role[]): boolean {
    return this.permissionKeysForRole(this.currentRoleFrom(users, roles)).includes(
      this.manageAssetsPermissionKey,
    );
  }

  /**
   * @summary Checks whether the current user can inspect monitored asset readings.
   */
  canMonitorAssets(users: User[], roles: Role[]): boolean {
    return this.permissionKeysForRole(this.currentRoleFrom(users, roles)).includes(
      this.monitorAssetsPermissionKey,
    );
  }

  /**
   * @summary Checks whether the current user can manage administrator roles.
   */
  canManageAdministrators(users: User[], roles: Role[]): boolean {
    return this.isSuperAdministratorRole(this.currentRoleFrom(users, roles));
  }

  /**
   * @summary Checks whether the current user may assign a target role.
   */
  canAssignRole(role: Role | undefined, users: User[], roles: Role[]): boolean {
    if (!role || !this.canManageUsers(users, roles) || this.isSuperAdministratorRole(role)) {
      return false;
    }

    if (this.isAdministratorRole(role)) {
      return this.canManageAdministrators(users, roles);
    }

    return true;
  }

  /**
   * @summary Checks whether the current user may edit another user role.
   */
  canManageUserRole(user: User | undefined, users: User[], roles: Role[]): boolean {
    if (!user || !this.canManageUsers(users, roles)) {
      return false;
    }

    const role = roles.find(currentRole => currentRole.id === user.roleId);

    if (this.isSuperAdministratorRole(role)) {
      return false;
    }

    if (this.isAdministratorRole(role)) {
      return this.canManageAdministrators(users, roles);
    }

    return true;
  }

  /**
   * @summary Builds the translation key used to display a role label.
   */
  roleLabelKey(role?: Role): string {
    if (!role) {
      return 'roles-permissions.roles.unassigned';
    }

    return `roles-permissions.roles.${role.name}`;
  }

  /**
   * @summary Checks whether a permission toggle should be locked.
   */
  isPermissionToggleDisabled(role: Role, permissionKey: string): boolean {
    if (this.isSuperAdministratorRole(role) || this.isAdministratorRole(role)) {
      return true;
    }

    if (permissionKey === this.manageAdministratorsPermissionKey) {
      return true;
    }

    const selectedPermissionKeys = this.permissionKeysForRole(role).filter(
      (currentKey) => currentKey !== 'roles-permissions.permissions.none',
    );

    return (
      !this.isPermissionSelected(role, permissionKey) &&
      selectedPermissionKeys.length >= this.availablePermissionKeys.length - 1
    );
  }

  /**
   * @summary Adds or removes a permission for a role and persists it.
   */
  toggleRolePermission(role: Role, permissionKey: string, checked: boolean): Observable<Role> {
    if (
      this.isSuperAdministratorRole(role) ||
      this.isAdministratorRole(role) ||
      permissionKey === this.manageAdministratorsPermissionKey
    ) {
      return of(role);
    }

    const previousKeys = this.permissionKeysForRole(role).filter(
      (currentKey) => currentKey !== 'roles-permissions.permissions.none',
    );
    const nextKeys = this.nextPermissionKeys(previousKeys, permissionKey, checked);

    if (nextKeys.length === this.availablePermissionKeys.length) {
      return of(role);
    }

    const updatedRole = this.roleWithPermissionKeys(role, nextKeys);
    this.setPermissionKeysForRole(role.id, nextKeys);
    this.updateRoleState(updatedRole);

    return this.identityAccessApi.updateRole(updatedRole).pipe(
      tap((savedRole) => {
        const savedKeys = this.permissionKeysFromRole(savedRole);
        this.setPermissionKeysForRole(savedRole.id, savedKeys);
        this.updateRoleState(savedRole);
      }),
      catchError((error) => {
        this.setPermissionKeysForRole(role.id, previousKeys);
        this.updateRoleState(this.roleWithPermissionKeys(role, previousKeys));
        return throwError(() => error);
      }),
    );
  }

  private permissionStateFromRoles(roles: Role[]): Record<number, string[]> {
    return roles.reduce(
      (state, role) => ({
        ...state,
        [role.id]: this.permissionKeysFromRole(role),
      }),
      {},
    );
  }

  private permissionKeysFromRole(role: Role): string[] {
    const persistedPermissionKeys = role.permissions
      .map((permission) => this.permissionKeyFrom(permission))
      .filter((permissionKey): permissionKey is string => permissionKey !== null);

    return this.orderPermissionKeys(
      persistedPermissionKeys.length
        ? persistedPermissionKeys
        : this.defaultPermissionKeysByRoleName[role.name] ?? [],
    );
  }

  private permissionKeyFrom(permission: Permission): string | null {
    const descriptionKey = this.availablePermissionKeys.find(
      (permissionKey) => permissionKey === permission.description,
    );

    if (descriptionKey) {
      return descriptionKey;
    }

    return (
      this.permissionDefinitions.find(
        (definition) =>
          definition.resource === permission.resource && definition.action === permission.action,
      )?.key ?? null
    );
  }

  private roleWithPermissionKeys(role: Role, permissionKeys: string[]): Role {
    return new Role(
      role.id,
      role.name,
      role.label,
      this.orderPermissionKeys(permissionKeys).map(
        (permissionKey, index) =>
          new Permission(
            index + 1,
            this.permissionDefinitionFor(permissionKey).resource,
            this.permissionDefinitionFor(permissionKey).action,
            permissionKey,
          ),
      ),
    );
  }

  private permissionDefinitionFor(permissionKey: string): PermissionDefinition {
    return (
      this.permissionDefinitions.find((definition) => definition.key === permissionKey) ??
      this.permissionDefinitions[this.permissionDefinitions.length - 1]
    );
  }

  private nextPermissionKeys(
    currentKeys: string[],
    permissionKey: string,
    checked: boolean,
  ): string[] {
    const nextKeys = checked
      ? [...currentKeys, permissionKey]
      : currentKeys.filter((currentKey) => currentKey !== permissionKey);

    return this.orderPermissionKeys(nextKeys);
  }

  private orderPermissionKeys(permissionKeys: string[]): string[] {
    return this.availablePermissionKeys.filter((permissionKey) =>
      permissionKeys.includes(permissionKey),
    );
  }

  private setPermissionKeysForRole(roleId: number, permissionKeys: string[]): void {
    this.rolePermissionKeysByRoleIdSignal.update((current) => ({
      ...current,
      [roleId]: this.orderPermissionKeys(permissionKeys),
    }));
  }

  private updateRoleState(role: Role): void {
    this.rolesSignal.update((roles) =>
      roles.map((currentRole) => (currentRole.id === role.id ? role : currentRole)),
    );
  }
}
