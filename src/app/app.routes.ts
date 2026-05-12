import { Routes } from '@angular/router';

const identityAccessRoutes = () =>
  import('./identity-access/presentation/identity-access.routes').then(
    (m) => m.identityAccessRoutes,
  );
const assetManagementRoutes = () =>
  import('./asset-management/presentation/asset-management.routes').then(
    (m) => m.assetManagementRoutes,
  );
const monitoringRoutes = () =>
  import('./monitoring/presentation/monitoring.routes').then((m) => m.monitoringRoutes);
const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

export const routes: Routes = [
  { path: 'identity-access', loadChildren: identityAccessRoutes },
  { path: 'asset-management', loadChildren: assetManagementRoutes },
  { path: 'monitoring', loadChildren: monitoringRoutes },
  { path: '', redirectTo: '/identity-access/sign-in', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: 'ColdTrace - Page Not Found' },
];
