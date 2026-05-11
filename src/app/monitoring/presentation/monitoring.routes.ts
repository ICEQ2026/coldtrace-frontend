import { Routes } from '@angular/router';

const operationalDashboard = () =>
  import('./views/operational-dashboard/operational-dashboard')
    .then(m => m.OperationalDashboard);

export const monitoringRoutes: Routes = [
  { path: 'operational', loadComponent: operationalDashboard, title: 'ColdTrace - Overview' },
  { path: '', redirectTo: 'operational', pathMatch: 'full' },
];
