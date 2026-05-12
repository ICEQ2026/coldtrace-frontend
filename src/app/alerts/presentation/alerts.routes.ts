import { Routes } from '@angular/router';

const alertsList = () =>
  import('./views/alerts-list/alerts-list').then((m) => m.AlertsList);

export const alertsRoutes: Routes = [
  {
    path: '',
    loadComponent: alertsList,
    title: 'ColdTrace - Alerts',
  },
];
