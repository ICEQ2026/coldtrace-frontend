import { Routes } from '@angular/router';

const signUp = () => import('./views/sign-up/sign-up').then(m => m.SignUp);

export const identityAccessRoutes: Routes = [
  { path: 'sign-up', loadComponent: signUp, title: 'ColdTrace - Create account' },
  { path: '', redirectTo: 'sign-up', pathMatch: 'full' }
];
