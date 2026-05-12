import { Routes } from '@angular/router';

const incidentList = () =>
  import('./views/incident-list/incident-list').then((m) => m.IncidentList);

export const alertsRoutes: Routes = [
  {
    path: 'incidents',
    loadComponent: incidentList,
    title: 'ColdTrace - Incidents',
  },
  { path: '', redirectTo: 'incidents', pathMatch: 'full' },
];
