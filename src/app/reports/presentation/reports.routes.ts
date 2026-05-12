import { Routes } from '@angular/router';

const dailyLog = () => import('./views/daily-log/daily-log').then((m) => m.DailyLog);
const operationalHistory = () =>
  import('./views/operational-history/operational-history').then((m) => m.OperationalHistory);

export const reportsRoutes: Routes = [
  {
    path: 'daily-log',
    loadComponent: dailyLog,
    title: 'ColdTrace - Daily Log',
  },
  {
    path: 'history',
    loadComponent: operationalHistory,
    title: 'ColdTrace - Operational History',
  },
  { path: '', redirectTo: 'daily-log', pathMatch: 'full' },
];
