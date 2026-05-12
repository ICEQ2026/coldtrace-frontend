import { Routes } from '@angular/router';

const dailyLog = () => import('./views/daily-log/daily-log').then((m) => m.DailyLog);

export const reportsRoutes: Routes = [
  {
    path: 'daily-log',
    loadComponent: dailyLog,
    title: 'ColdTrace - Daily Log',
  },
  { path: '', redirectTo: 'daily-log', pathMatch: 'full' },
];
