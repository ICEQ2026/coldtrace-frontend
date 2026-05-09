import { Routes } from '@angular/router';

const passwordRecovery = () =>
  import('./views/password-recovery/password-recovery').then((m) => m.PasswordRecovery);
const resetPassword = () =>
  import('./views/reset-password/reset-password').then((m) => m.ResetPassword);
const signIn = () => import('./views/sign-in/sign-in').then((m) => m.SignIn);
const signUp = () => import('./views/sign-up/sign-up').then((m) => m.SignUp);
const dashboardPlaceholder = () =>
  import('./views/dashboard-placeholder/dashboard-placeholder').then((m) => m.DashboardPlaceholder);
const rolePermissionForm = () =>
  import('./views/role-permission-form/role-permission-form').then((m) => m.RolePermissionForm);
const userForm = () => import('./views/user-form/user-form').then((m) => m.UserForm);
const userAccessList = () =>
  import('./views/user-access-list/user-access-list').then((m) => m.UserAccessList);

export const identityAccessRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: dashboardPlaceholder,
    title: 'ColdTrace - Dashboard',
    data: { pageTitleKey: 'roles-permissions.main-page-title' },
  },
  {
    path: 'assets',
    redirectTo: '/asset-management/assets',
    pathMatch: 'full',
  },
  {
    path: 'alerts',
    loadComponent: dashboardPlaceholder,
    title: 'ColdTrace - Alerts',
    data: { pageTitleKey: 'roles-permissions.alerts-page-title' },
  },
  {
    path: 'monitoring',
    loadComponent: dashboardPlaceholder,
    title: 'ColdTrace - Monitoring',
    data: { pageTitleKey: 'roles-permissions.monitoring-page-title' },
  },
  {
    path: 'reports',
    loadComponent: dashboardPlaceholder,
    title: 'ColdTrace - Reports',
    data: { pageTitleKey: 'roles-permissions.reports-page-title' },
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
    path: 'roles-permissions',
    loadComponent: userAccessList,
    title: 'ColdTrace - Roles and permissions',
  },
  { path: 'sign-in', loadComponent: signIn, title: 'ColdTrace - Sign in' },
  { path: 'sign-up', loadComponent: signUp, title: 'ColdTrace - Create account' },
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
];
