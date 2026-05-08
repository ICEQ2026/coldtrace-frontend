import { Routes } from '@angular/router';

const signIn = () => import('./views/sign-in/sign-in').then(m => m.SignIn);
const signUp = () => import('./views/sign-up/sign-up').then(m => m.SignUp);

export const identityAccessRoutes: Routes = [
  { path: 'sign-in', loadComponent: signIn, title: 'ColdTrace - Sign in' },
  { path: 'sign-up', loadComponent: signUp, title: 'ColdTrace - Create account' },
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' }
];
