import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { IdentityAccessApi } from '../../../infrastructure/identity-access-api';

type SignInFeedback = 'idle' | 'invalid-credentials' | 'revoked-access' | 'success' | 'server-error';

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
  private readonly identityAccessApi = inject(IdentityAccessApi);

  protected readonly submitted = signal(false);
  protected readonly signingIn = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly feedback = signal<SignInFeedback>('idle');

  protected readonly signInForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    keepSignedIn: [true],
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
    this.identityAccessApi
      .getUsers()
      .pipe(finalize(() => this.signingIn.set(false)))
      .subscribe({
        next: (users) => {
          if (email === this.revokedAccessEmail) {
            this.feedback.set('revoked-access');
            return;
          }

          const userExists = users.some((user) => user.email.toLowerCase() === email);
          const validCredentials = userExists && password === this.validPassword;
          this.feedback.set(validCredentials ? 'success' : 'invalid-credentials');

          if (validCredentials) {
            this.submitted.set(false);
          }
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected hasControlError(controlName: keyof typeof this.signInForm.controls): boolean {
    const control = this.signInForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }
}
