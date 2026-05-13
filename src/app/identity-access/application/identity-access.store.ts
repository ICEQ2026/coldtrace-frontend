import { computed, Injectable, signal } from '@angular/core';
import { Organization } from '../domain/model/organization.entity';
import { RoleName } from '../domain/model/role-name.enum';
import { Role } from '../domain/model/role.entity';
import { User } from '../domain/model/user.entity';
import { IdentityAccessApi } from '../infrastructure/identity-access-api';

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
  readonly availablePermissionKeys = [
    this.manageAdministratorsPermissionKey,
    'roles-permissions.permissions.manage-users',
    'roles-permissions.permissions.manage-assets',
    'roles-permissions.permissions.view-reports',
    'roles-permissions.permissions.resolve-alerts',
    'roles-permissions.permissions.monitor-assets',
    'roles-permissions.permissions.read-only',
  ];

  /**
   * @summary Frontend permission matrix used until real backend authorization exists.
   */
  private readonly defaultPermissionKeysByRoleName: Record<RoleName, string[]> = {
    [RoleName.SuperAdministrator]: [...this.availablePermissionKeys],
    [RoleName.Administrator]: this.availablePermissionKeys.filter(
      (permissionKey) => permissionKey !== this.manageAdministratorsPermissionKey,
    ),
    [RoleName.OperationsManager]: [
      'roles-permissions.permissions.manage-assets',
      'roles-permissions.permissions.resolve-alerts',
      'roles-permissions.permissions.view-reports',
    ],
    [RoleName.Operator]: [
      'roles-permissions.permissions.monitor-assets',
      'roles-permissions.permissions.resolve-alerts',
    ],
    [RoleName.Auditor]: [
      'roles-permissions.permissions.view-reports',
      'roles-permissions.permissions.read-only',
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
    if (Object.keys(this.rolePermissionKeysByRoleIdSignal()).length) {
      return;
    }

    this.rolePermissionKeysByRoleIdSignal.set(
      roles.reduce(
        (state, role) => ({
          ...state,
          [role.id]: this.defaultPermissionKeysByRoleName[role.name] ?? [],
        }),
        {},
      ),
    );
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
      this.defaultPermissionKeysByRoleName[role.name] ??
      [];

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
    const role = this.currentRoleFrom(users, roles);
    return this.isSuperAdministratorRole(role) || this.isAdministratorRole(role);
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
    if (!role || !this.canManageAccess(users, roles) || this.isSuperAdministratorRole(role)) {
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
    if (!user || !this.canManageAccess(users, roles)) {
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
   * @summary Adds or removes a permission for a role in local state.
   */
  toggleRolePermission(role: Role, permissionKey: string, checked: boolean): void {
    if (
      this.isSuperAdministratorRole(role) ||
      this.isAdministratorRole(role) ||
      permissionKey === this.manageAdministratorsPermissionKey
    ) {
      return;
    }

    this.rolePermissionKeysByRoleIdSignal.update((current) => {
      const currentKeys = current[role.id] ?? this.defaultPermissionKeysByRoleName[role.name] ?? [];
      const nextPermissionKeys = checked
        ? [...currentKeys, permissionKey]
        : currentKeys.filter((currentKey) => currentKey !== permissionKey);
      const orderedPermissionKeys = this.availablePermissionKeys.filter((currentKey) =>
        nextPermissionKeys.includes(currentKey),
      );

      if (orderedPermissionKeys.length === this.availablePermissionKeys.length) {
        return current;
      }

      return {
        ...current,
        [role.id]: orderedPermissionKeys,
      };
    });
  }

}
