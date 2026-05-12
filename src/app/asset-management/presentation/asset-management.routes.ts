import { Routes } from '@angular/router';

const coldRoomList = () =>
  import('./views/cold-room-list/cold-room-list').then((m) => m.ColdRoomList);

const safetyRangeSettings = () =>
  import('./views/safety-range-settings/safety-range-settings').then((m) => m.SafetyRangeSettings);

export const assetManagementRoutes: Routes = [
  {
    path: 'assets',
    loadComponent: coldRoomList,
    title: 'ColdTrace - Assets',
  },
  {
    path: 'safety-ranges',
    loadComponent: safetyRangeSettings,
    title: 'ColdTrace - Safety ranges',
  },
  { path: '', redirectTo: 'assets', pathMatch: 'full' },
];
