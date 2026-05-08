import { computed, Injectable, signal } from '@angular/core';
import { Organization } from '../domain/model/organization.entity';
import { Role } from '../domain/model/role.entity';
import { User } from '../domain/model/user.entity';
import { IdentityAccessApi } from '../infrastructure/identity-access-api';

@Injectable({ providedIn: 'root' })
export class IdentityAccessStore {
  private readonly usersSignal = signal<User[]>([]);
  private readonly organizationsSignal = signal<Organization[]>([]);
  private readonly rolesSignal = signal<Role[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly users = this.usersSignal.asReadonly();
  readonly organizations = this.organizationsSignal.asReadonly();
  readonly roles = this.rolesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly userCount = computed(() => this.users().length);

  constructor(private identityAccessApi: IdentityAccessApi) {}

  loadUsers(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.identityAccessApi.getUsers().subscribe({
      next: users => {
        this.usersSignal.set(users);
        this.loadingSignal.set(false);
      },
      error: error => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      }
    });
  }

  loadOrganizations(): void {
    this.identityAccessApi.getOrganizations().subscribe({
      next: organizations => this.organizationsSignal.set(organizations),
      error: error => this.errorSignal.set(error.message)
    });
  }

  loadRoles(): void {
    this.identityAccessApi.getRoles().subscribe({
      next: roles => this.rolesSignal.set(roles),
      error: error => this.errorSignal.set(error.message)
    });
  }
}
