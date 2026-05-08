import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

type ResetPasswordFeedback = 'idle' | 'success';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitted = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly expired = signal(false);
  protected readonly feedback = signal<ResetPasswordFeedback>('idle');

  protected readonly resetPasswordForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  protected readonly passwordMismatch = computed(() => {
    const password = this.resetPasswordForm.controls.password.value;
    const confirmation = this.resetPasswordForm.controls.confirmPassword.value;
    return this.submitted() && !!confirmation && password !== confirmation;
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.expired.set(params.get('state') === 'expired');
    });
  }

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.resetPasswordForm.markAllAsTouched();

    if (this.expired() || this.resetPasswordForm.invalid || this.passwordMismatch()) {
      return;
    }

    this.feedback.set('success');
    this.submitted.set(false);
    this.resetPasswordForm.reset({
      password: '',
      confirmPassword: '',
    });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected hasControlError(controlName: keyof typeof this.resetPasswordForm.controls): boolean {
    const control = this.resetPasswordForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }
}
