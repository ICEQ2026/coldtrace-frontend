import { Routes } from '@angular/router';

const passwordRecovery = () =>
  import('./views/password-recovery/password-recovery').then((m) => m.PasswordRecovery);
const resetPassword = () =>
  import('./views/reset-password/reset-password').then((m) => m.ResetPassword);
const signIn = () => import('./views/sign-in/sign-in').then((m) => m.SignIn);
const signUp = () => import('./views/sign-up/sign-up').then((m) => m.SignUp);
const rolePermissionForm = () =>
  import('./views/role-permission-form/role-permission-form').then((m) => m.RolePermissionForm);
const userForm = () => import('./views/user-form/user-form').then((m) => m.UserForm);
const userAccessList = () =>
  import('./views/user-access-list/user-access-list').then((m) => m.UserAccessList);
const operationalDashboard = () =>
  import('../../monitoring/presentation/views/operational-dashboard/operational-dashboard').then(
    (m) => m.OperationalDashboard,
  );

export const identityAccessRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: operationalDashboard,
    title: 'ColdTrace - Main',
  },
  {
    path: 'assets',
    redirectTo: '/asset-management/assets',
    pathMatch: 'full',
  },
  {
    path: 'alerts',
    redirectTo: '/alerts',
    pathMatch: 'full',
  },
  {
    path: 'monitoring',
    redirectTo: '/monitoring/operational',
    pathMatch: 'full',
  },
  {
    path: 'reports',
    redirectTo: '/reports/daily-log',
    pathMatch: 'full',
  },
  {
    path: 'password-recovery',
    loadComponent: passwordRecovery,
    title: 'ColdTrace - Password recovery',
  },
  { path: 'reset-password', loadComponent: resetPassword, title: 'ColdTrace - Reset password' },
  {
    path: 'roles-permissions/permissions',
    loadComponent: rolePermissionForm,
    title: 'ColdTrace - Role permissions',
  },
  {
    path: 'roles-permissions/users/new',
    loadComponent: userForm,
    title: 'ColdTrace - Create user',
  },
  {
    path: 'users',
    redirectTo: 'roles-permissions',
    pathMatch: 'full',
  },
  {
    path: 'roles-permissions',
    loadComponent: userAccessList,
    title: 'ColdTrace - Roles and permissions',
  },
  { path: 'sign-in', loadComponent: signIn, title: 'ColdTrace - Sign in' },
  { path: 'sign-up', loadComponent: signUp, title: 'ColdTrace - Create account' },
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
];
