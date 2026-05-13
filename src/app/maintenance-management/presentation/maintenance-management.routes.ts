import { Routes } from '@angular/router';

const preventiveMaintenanceScheduler = () =>
  import('./views/preventive-maintenance-scheduler/preventive-maintenance-scheduler').then(
    (m) => m.PreventiveMaintenanceScheduler,
  );
const technicalServiceTracker = () =>
  import('./views/technical-service-tracker/technical-service-tracker').then(
    (m) => m.TechnicalServiceTracker,
  );

/**
 * @summary Defines the lazy-loaded routes for the maintenance management bounded context.
 */
export const maintenanceManagementRoutes: Routes = [
  {
    path: 'preventive',
    loadComponent: preventiveMaintenanceScheduler,
    title: 'ColdTrace - Preventive maintenance',
  },
  {
    path: 'technical-service',
    loadComponent: technicalServiceTracker,
    title: 'ColdTrace - Technical service',
  },
  { path: '', redirectTo: 'preventive', pathMatch: 'full' },
];
