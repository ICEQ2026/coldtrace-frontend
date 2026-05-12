import { Routes } from '@angular/router';

const preventiveMaintenanceScheduler = () =>
  import('./views/preventive-maintenance-scheduler/preventive-maintenance-scheduler').then(
    (m) => m.PreventiveMaintenanceScheduler,
  );

export const maintenanceManagementRoutes: Routes = [
  {
    path: 'preventive',
    loadComponent: preventiveMaintenanceScheduler,
    title: 'ColdTrace - Preventive maintenance',
  },
  { path: '', redirectTo: 'preventive', pathMatch: 'full' },
];
