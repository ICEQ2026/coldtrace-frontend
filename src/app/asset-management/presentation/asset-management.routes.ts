import { Routes } from '@angular/router';

const coldRoomList = () =>
  import('./views/cold-room-list/cold-room-list').then((m) => m.ColdRoomList);

export const assetManagementRoutes: Routes = [
  {
    path: 'assets',
    loadComponent: coldRoomList,
    title: 'ColdTrace - Assets',
  },
  { path: '', redirectTo: 'assets', pathMatch: 'full' },
];
