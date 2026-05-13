import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { IdentityAccessApi } from '../../../infrastructure/identity-access-api';

type PasswordRecoveryFeedback = 'idle' | 'sent' | 'not-found' | 'server-error';

/**
 * @summary Presents the password recovery user interface in the identity access bounded context.
 */
@Component({
  selector: 'app-password-recovery',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './password-recovery.html',
  styleUrl: './password-recovery.css',
})
export class PasswordRecovery {
  private readonly fb = inject(FormBuilder);
  private readonly identityAccessApi = inject(IdentityAccessApi);

  protected readonly submitted = signal(false);
  protected readonly requesting = signal(false);
  protected readonly feedback = signal<PasswordRecoveryFeedback>('idle');

  protected readonly recoveryForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.recoveryForm.markAllAsTouched();

    if (this.recoveryForm.invalid) {
      return;
    }

    const email = this.recoveryForm.controls.email.value.trim().toLowerCase();

    this.requesting.set(true);
    this.identityAccessApi
      .getUsers()
      .pipe(finalize(() => this.requesting.set(false)))
      .subscribe({
        next: (users) => {
          const userExists = users.some((user) => user.email.toLowerCase() === email);
          this.feedback.set(userExists ? 'sent' : 'not-found');

          if (userExists) {
            this.submitted.set(false);
          }
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected hasControlError(controlName: keyof typeof this.recoveryForm.controls): boolean {
    const control = this.recoveryForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }
}
