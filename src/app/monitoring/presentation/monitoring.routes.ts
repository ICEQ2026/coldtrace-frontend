import { Routes } from '@angular/router';

const dashboardPlaceholder = () =>
  import('../../identity-access/presentation/views/dashboard-placeholder/dashboard-placeholder')
    .then(m => m.DashboardPlaceholder);

export const monitoringRoutes: Routes = [
  {
    path: 'operational',
    loadComponent: dashboardPlaceholder,
    title: 'ColdTrace - Monitoring',
    data: { pageTitleKey: 'monitoring.operational.title' },
  },
  { path: '', redirectTo: 'operational', pathMatch: 'full' },
];
