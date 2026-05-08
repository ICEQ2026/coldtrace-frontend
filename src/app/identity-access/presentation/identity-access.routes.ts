import { Routes } from '@angular/router';

const passwordRecovery = () =>
  import('./views/password-recovery/password-recovery').then(m => m.PasswordRecovery);
const resetPassword = () =>
  import('./views/reset-password/reset-password').then(m => m.ResetPassword);
const signIn = () => import('./views/sign-in/sign-in').then(m => m.SignIn);
const signUp = () => import('./views/sign-up/sign-up').then(m => m.SignUp);

export const identityAccessRoutes: Routes = [
  {
    path: 'password-recovery',
    loadComponent: passwordRecovery,
    title: 'ColdTrace - Password recovery'
  },
  { path: 'reset-password', loadComponent: resetPassword, title: 'ColdTrace - Reset password' },
  { path: 'sign-in', loadComponent: signIn, title: 'ColdTrace - Sign in' },
  { path: 'sign-up', loadComponent: signUp, title: 'ColdTrace - Create account' },
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' }
];
