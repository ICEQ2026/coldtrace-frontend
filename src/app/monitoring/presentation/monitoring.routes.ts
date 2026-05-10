import { Routes } from '@angular/router';

const operationalDashboard = () =>
  import('./views/operational-dashboard/operational-dashboard')
    .then((m) => m.OperationalDashboard);
const monitoringDashboard = () =>
  import('./views/monitoring-dashboard/monitoring-dashboard')
    .then((m) => m.MonitoringDashboard);
const temperatureView = () =>
  import('./views/temperature-view/temperature-view').then((m) => m.TemperatureView);
const humidityView = () =>
  import('./views/humidity-view/humidity-view').then((m) => m.HumidityView);
const readingHistory = () =>
  import('./views/reading-history/reading-history').then((m) => m.ReadingHistory);
const alertsView = () =>
  import('./views/alerts-view/alerts-view').then((m) => m.AlertsView);
const connectivityView = () =>
  import('./views/connectivity-view/connectivity-view').then((m) => m.ConnectivityView);
const offlineSync = () =>
  import('./views/offline-sync/offline-sync').then((m) => m.OfflineSync);

export const monitoringRoutes: Routes = [
  { path: 'operational', loadComponent: operationalDashboard, title: 'ColdTrace - Overview'     },
  { path: 'dashboard',   loadComponent: monitoringDashboard,  title: 'ColdTrace - Monitoring'   },
  { path: 'temperature', loadComponent: temperatureView,      title: 'ColdTrace - Temperature'  },
  { path: 'humidity',    loadComponent: humidityView,         title: 'ColdTrace - Humidity'      },
  { path: 'history',     loadComponent: readingHistory,       title: 'ColdTrace - History'       },
  { path: 'alerts',      loadComponent: alertsView,           title: 'ColdTrace - Alerts'        },
  { path: 'connectivity',loadComponent: connectivityView,     title: 'ColdTrace - Connectivity'  },
  { path: 'sync',        loadComponent: offlineSync,          title: 'ColdTrace - Sync'          },
  { path: '', redirectTo: 'operational', pathMatch: 'full' },
];
