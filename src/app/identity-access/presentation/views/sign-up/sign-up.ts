import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, forkJoin, map, switchMap, throwError } from 'rxjs';
import { IdentityAccessStore } from '../../../application/identity-access.store';
import { Organization } from '../../../domain/model/organization.entity';
import { RoleName } from '../../../domain/model/role-name.enum';
import { User } from '../../../domain/model/user.entity';
import { IdentityAccessApi } from '../../../infrastructure/identity-access-api';

type SignUpFeedback = 'idle' | 'duplicate-email' | 'success' | 'server-error';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {
  private readonly fb = inject(FormBuilder);
  private readonly identityAccessStore = inject(IdentityAccessStore);
  private readonly identityAccessApi = inject(IdentityAccessApi);

  protected readonly submitted = signal(false);
  protected readonly creating = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly feedback = signal<SignUpFeedback>('idle');

  protected readonly signUpForm = this.fb.nonNullable.group({
    organizationName: ['', [Validators.required, Validators.minLength(2)]],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptedTerms: [true, [Validators.requiredTrue]],
  });

  protected readonly passwordMismatch = computed(() => {
    const password = this.signUpForm.controls.password.value;
    const confirmation = this.signUpForm.controls.confirmPassword.value;
    return this.submitted() && !!confirmation && password !== confirmation;
  });

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.signUpForm.markAllAsTouched();

    if (this.signUpForm.invalid || this.passwordMismatch()) {
      return;
    }

    const email = this.signUpForm.controls.email.value.trim().toLowerCase();
    const organizationName = this.signUpForm.controls.organizationName.value.trim();
    const { firstName, lastName } = this.getNameParts(this.signUpForm.controls.fullName.value);

    this.creating.set(true);
    forkJoin({
      users: this.identityAccessApi.getUsers(),
      roles: this.identityAccessApi.getRoles(),
      organizations: this.identityAccessApi.getOrganizations(),
    })
      .pipe(
        switchMap(({ users, roles, organizations }) => {
          const emailAlreadyExists = users.some((user) => user.email.toLowerCase() === email);
          if (emailAlreadyExists) {
            return throwError(() => new Error('duplicate-email'));
          }

          const nextOrganizationId = Math.max(...organizations.map((organization) => organization.id), 0) + 1;
          const nextUserId = Math.max(...users.map((user) => user.id), 0) + 1;
          const creatorRole = roles.find((role) => role.name === RoleName.SuperAdministrator);

          if (!creatorRole) {
            return throwError(() => new Error('missing-creator-role'));
          }

          return this.identityAccessApi
            .createOrganization(new Organization(nextOrganizationId, organizationName, organizationName, '', email))
            .pipe(
              switchMap((organization) =>
                this.identityAccessApi.createUser(
                  new User(
                    nextUserId,
                    firstName,
                    lastName,
                    email,
                    organization.id,
                    creatorRole.id,
                    `USR-${nextUserId}`,
                    1,
                  ),
                ).pipe(map((user) => ({ user, roles, organization }))),
              ),
            );
        }),
        finalize(() => this.creating.set(false)),
      )
      .subscribe({
        next: ({ user, roles, organization }) => {
          this.identityAccessStore.setCurrentUser(user);
          this.identityAccessStore.setCurrentRoleFrom([user], roles);
          this.identityAccessStore.setCurrentOrganization(organization);
          this.feedback.set('success');
          this.submitted.set(false);
          this.signUpForm.reset({
            organizationName: '',
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            acceptedTerms: true,
          });
        },
        error: (error) => {
          this.feedback.set(
            error.message === 'duplicate-email' ? 'duplicate-email' : 'server-error',
          );
        },
      });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected hasControlError(controlName: keyof typeof this.signUpForm.controls): boolean {
    const control = this.signUpForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  private getNameParts(fullName: string): { firstName: string; lastName: string } {
    const [firstName, ...lastNameParts] = fullName.trim().replace(/\s+/g, ' ').split(' ');
    return {
      firstName,
      lastName: lastNameParts.join(' '),
    };
  }
}
