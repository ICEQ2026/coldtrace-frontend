import { Routes } from '@angular/router';

const dailyLog = () => import('./views/daily-log/daily-log').then((m) => m.DailyLog);
const monthlyReport = () =>
  import('./views/monthly-report/monthly-report').then((m) => m.MonthlyReport);
const operationalHistory = () =>
  import('./views/operational-history/operational-history').then((m) => m.OperationalHistory);
const sanitaryCompliance = () =>
  import('./views/sanitary-compliance/sanitary-compliance').then((m) => m.SanitaryCompliance);

export const reportsRoutes: Routes = [
  {
    path: 'daily-log',
    loadComponent: dailyLog,
    title: 'ColdTrace - Daily Log',
  },
  {
    path: 'monthly',
    loadComponent: monthlyReport,
    title: 'ColdTrace - Monthly Report',
  },
  {
    path: 'history',
    loadComponent: operationalHistory,
    title: 'ColdTrace - Operational History',
  },
  {
    path: 'compliance',
    loadComponent: sanitaryCompliance,
    title: 'ColdTrace - Sanitary Compliance',
  },
  { path: '', redirectTo: 'daily-log', pathMatch: 'full' },
];
