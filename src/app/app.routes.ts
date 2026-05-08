import { Routes } from '@angular/router';

const identityAccessRoutes = () =>
  import('./identity-access/presentation/identity-access.routes')
    .then(m => m.identityAccessRoutes);

export const routes: Routes = [
  { path: 'identity-access', loadChildren: identityAccessRoutes },
  { path: '', redirectTo: '/identity-access/sign-up', pathMatch: 'full' }
];
