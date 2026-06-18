import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IdentityAccessStore } from '../../../application/identity-access.store';
import { Organization } from '../../../domain/model/organization.entity';
import { Role } from '../../../domain/model/role.entity';
import { User } from '../../../domain/model/user.entity';
import { IdentityAccessApi } from '../../../infrastructure/identity-access-api';
import { OrganizationScopeStore } from '../../../../shared/infrastructure/organization-scope.store';

type SignInFeedback = 'idle' | 'invalid-credentials' | 'revoked-access' | 'success' | 'server-error';

/**
 * @summary Presents the sign in user interface in the identity access bounded context.
 */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  private readonly validPassword = 'ColdTrace123';
  private readonly revokedAccessEmail = 'revoked@coldtrace.com';
  private readonly fb = inject(FormBuilder);
  private readonly identityAccessStore = inject(IdentityAccessStore);
  private readonly identityAccessApi = inject(IdentityAccessApi);
  private readonly organizationScope = inject(OrganizationScopeStore);
  private readonly router = inject(Router);

  protected readonly submitted = signal(false);
  protected readonly signingIn = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly feedback = signal<SignInFeedback>('idle');

  protected readonly signInForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.signInForm.markAllAsTouched();

    if (this.signInForm.invalid) {
      return;
    }

    const email = this.signInForm.controls.email.value.trim().toLowerCase();
    const password = this.signInForm.controls.password.value;

    this.signingIn.set(true);
    this.identityAccessApi.getRoles().subscribe({
      next: (roles) => this.loadOrganizationsForSignIn(roles, email, password),
      error: () => this.handleServerError(),
    });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected hasControlError(controlName: keyof typeof this.signInForm.controls): boolean {
    const control = this.signInForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  private loadOrganizationsForSignIn(
    roles: Role[],
    email: string,
    password: string,
  ): void {
    this.identityAccessApi.getOrganizations().subscribe({
      next: (organizations) => this.loadUsersForSignIn(organizations, roles, email, password),
      error: () => this.handleServerError(),
    });
  }

  private loadUsersForSignIn(
    organizations: Organization[],
    roles: Role[],
    email: string,
    password: string,
  ): void {
    if (!organizations.length) {
      this.signingIn.set(false);
      this.feedback.set('invalid-credentials');
      return;
    }

    const organization = this.organizationForSignIn(organizations, email);
    this.loadSignInUsersForOrganization(organization, organizations, roles, email, password);
  }

  private organizationForSignIn(organizations: Organization[], email: string): Organization {
    let matchingOrganization: Organization | undefined;

    for (const organization of organizations) {
      if (organization.contactEmail.toLowerCase() === email) {
        matchingOrganization = organization;
      }
    }

    if (matchingOrganization) {
      return matchingOrganization;
    }

    const activeOrganizationId = this.organizationScope.activeOrganizationId();
    const activeOrganization = organizations.find(
      (organization) => organization.id === activeOrganizationId,
    );

    return activeOrganization ?? organizations[0];
  }

  private loadSignInUsersForOrganization(
    organization: Organization,
    organizations: Organization[],
    roles: Role[],
    email: string,
    password: string,
    checkedOrganizationIds: number[] = [],
  ): void {
    this.identityAccessApi.getUsersForOrganization(organization.id).subscribe({
      next: (users) => {
        const userExists = users.some((user) => user.email.toLowerCase() === email);

        if (userExists || checkedOrganizationIds.length + 1 >= organizations.length) {
          this.organizationScope.setActiveOrganizationId(organization.id);
          this.signingIn.set(false);
          this.resolveSignIn(users, roles, organizations, email, password);
          return;
        }

        const nextOrganization = organizations.find(
          (currentOrganization) =>
            currentOrganization.id !== organization.id &&
            !checkedOrganizationIds.includes(currentOrganization.id),
        );

        if (!nextOrganization) {
          this.organizationScope.setActiveOrganizationId(organization.id);
          this.signingIn.set(false);
          this.resolveSignIn(users, roles, organizations, email, password);
          return;
        }

        this.loadSignInUsersForOrganization(
          nextOrganization,
          organizations,
          roles,
          email,
          password,
          [...checkedOrganizationIds, organization.id],
        );
      },
      error: () => this.handleServerError(),
    });
  }

  private handleServerError(): void {
    this.signingIn.set(false);
    this.feedback.set('server-error');
  }

  private resolveSignIn(
    users: User[],
    roles: Role[],
    organizations: Organization[],
    email: string,
    password: string,
  ): void {
    if (email === this.revokedAccessEmail) {
      this.feedback.set('revoked-access');
      return;
    }

    const currentUser = users.find((user) => user.email.toLowerCase() === email);
    const validCredentials = !!currentUser && password === this.validPassword;
    this.feedback.set(validCredentials ? 'success' : 'invalid-credentials');

    if (validCredentials && currentUser) {
      this.identityAccessStore.setCurrentUser(currentUser);
      this.identityAccessStore.setCurrentContextFrom(users, roles, organizations);
      this.submitted.set(false);
      void this.router.navigate(['/identity-access/dashboard'], {
        queryParams: {
          organizationId: currentUser.organizationId,
          userId: currentUser.id,
        },
      });
    }
  }
}
