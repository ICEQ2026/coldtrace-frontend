import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface ContextLink {
  path: string;
  labelKey: string;
  visible: boolean;
  queryParams?: Record<string, string>;
}
import { LanguageSwitcher } from '../language-switcher/language-switcher';

/**
 * @summary Presents the dashboard shell user interface in the shared bounded context.
 */
@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    LanguageSwitcher,
  ],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.css',
})
export class DashboardShell {
  private readonly router = inject(Router);

  @Input() activeOrganizationName = 'ColdTrace';
  @Input() pageTitleKey = '';
  @Input() profileUserName = 'ColdTrace';
  @Input() profileRoleLabelKey = 'roles-permissions.roles.unassigned';
  @Input() canManageAccess = false;
  @Input() canManageUsers = false;
  @Input() canMonitorAssets = false;
  @Input() assetIssuesCount = 0;
  @Input() pendingAlertsCount = 0;

  @Output() signedOut = new EventEmitter<void>();
  @Output() monthlyReportRequested = new EventEmitter<void>();

  protected accessDropdownOpen = false;
  protected accessDropdownTouched = false;
  protected reportsDropdownOpen = false;
  protected reportsDropdownTouched = false;
  protected settingsDropdownOpen = false;
  protected settingsDropdownTouched = false;

  protected isAccessDropdownOpen(isActive: boolean): boolean {
    return this.accessDropdownTouched ? this.accessDropdownOpen : isActive || this.isAccessRoute();
  }

  protected isReportsDropdownOpen(isActive: boolean): boolean {
    return this.reportsDropdownTouched
      ? this.reportsDropdownOpen
      : isActive || this.isReportsRoute();
  }

  protected isSettingsDropdownOpen(isActive: boolean): boolean {
    return this.settingsDropdownTouched
      ? this.settingsDropdownOpen
      : isActive || this.isSettingsRoute();
  }

  protected toggleAccessDropdown(isActive: boolean): void {
    this.accessDropdownOpen = !this.isAccessDropdownOpen(isActive);
    this.accessDropdownTouched = true;
  }

  protected toggleReportsDropdown(isActive: boolean): void {
    this.reportsDropdownOpen = !this.isReportsDropdownOpen(isActive);
    this.reportsDropdownTouched = true;
  }

  protected toggleSettingsDropdown(isActive: boolean): void {
    this.settingsDropdownOpen = !this.isSettingsDropdownOpen(isActive);
    this.settingsDropdownTouched = true;
  }

  protected contextualLinks(): ContextLink[] {
    const url = this.router.url;

    if (url.includes('/asset-management/assets')) {
      return [
        {
          path: '/asset-management/assets',
          labelKey: 'asset-management.tabs.cold-room',
          visible: true,
          queryParams: { tab: 'cold-room' },
        },
        {
          path: '/asset-management/assets',
          labelKey: 'asset-management.tabs.transport',
          visible: true,
          queryParams: { tab: 'transport' },
        },
        {
          path: '/asset-management/assets',
          labelKey: 'asset-management.tabs.iot-device',
          visible: true,
          queryParams: { tab: 'iot-device' },
        },
        {
          path: '/asset-management/assets',
          labelKey: 'asset-management.tabs.gateway',
          visible: true,
          queryParams: { tab: 'gateway' },
        },
      ];
    }

    if (url.includes('/monitoring/assets')) {
      return [
        {
          path: '/monitoring/assets',
          labelKey: 'monitoring.asset-monitoring.tabs.cold-room',
          visible: true,
          queryParams: { type: 'cold-room' },
        },
        {
          path: '/monitoring/assets',
          labelKey: 'monitoring.asset-monitoring.tabs.transport',
          visible: true,
          queryParams: { type: 'transport' },
        },
      ];
    }

    if (this.isAccessRoute()) {
      return [
        {
          path: '/identity-access/roles-permissions',
          labelKey: 'dashboard-shell.nav-users',
          visible: true,
        },
        {
          path: '/identity-access/roles-permissions/users/new',
          labelKey: 'dashboard-shell.nav-new-user',
          visible: this.canManageUsers,
        },
        {
          path: '/identity-access/roles-permissions/permissions',
          labelKey: 'dashboard-shell.nav-permissions',
          visible: this.canManageAccess,
        },
      ];
    }

    if (this.isSettingsRoute()) {
      return [
        {
          path: '/asset-management/safety-ranges',
          labelKey: 'dashboard-shell.nav-safety-ranges',
          visible: true,
        },
        {
          path: '/asset-management/operational-parameters',
          labelKey: 'dashboard-shell.nav-operational-parameters',
          visible: true,
        },
        {
          path: '/maintenance/preventive',
          labelKey: 'dashboard-shell.nav-preventive-maintenance',
          visible: true,
        },
        {
          path: '/maintenance/technical-service',
          labelKey: 'dashboard-shell.nav-technical-service',
          visible: true,
        },
      ];
    }

    if (this.isReportsRoute()) {
      return [
        { path: '/reports/daily-log', labelKey: 'dashboard-shell.nav-daily-log', visible: true },
        { path: '/reports/monthly', labelKey: 'dashboard-shell.nav-monthly-report', visible: true },
        { path: '/reports/history', labelKey: 'dashboard-shell.nav-history', visible: true },
        { path: '/reports/compliance', labelKey: 'dashboard-shell.nav-compliance', visible: true },
        { path: '/reports/findings', labelKey: 'dashboard-shell.nav-findings', visible: true },
        {
          path: '/reports/audit-evidence',
          labelKey: 'dashboard-shell.nav-audit-evidence',
          visible: true,
        },
      ];
    }

    return [];
  }

  protected isContextLinkActive(link: ContextLink): boolean {
    const [currentPath, currentQuery = ''] = this.router.url.split('?');

    if (currentPath !== link.path) {
      return false;
    }

    const expectedParams = Object.entries(link.queryParams ?? {});

    if (!expectedParams.length) {
      return true;
    }

    const queryParams = new URLSearchParams(currentQuery);

    return expectedParams.every(([key, value]) => {
      const currentValue = queryParams.get(key);

      if (currentValue === value) {
        return true;
      }

      return (
        (!currentValue && key === 'tab' && value === 'cold-room') ||
        (!currentValue && key === 'type' && value === 'cold-room')
      );
    });
  }

  protected logout(): void {
    this.signedOut.emit();
  }

  protected requestMonthlyReport(): void {
    this.monthlyReportRequested.emit();
  }

  private isAccessRoute(): boolean {
    const url = this.router.url;

    return (
      url.includes('/identity-access/users') || url.includes('/identity-access/roles-permissions')
    );
  }

  private isReportsRoute(): boolean {
    const url = this.router.url;

    return url.includes('/reports') || url.includes('/identity-access/reports');
  }

  private isSettingsRoute(): boolean {
    const url = this.router.url;

    return (
      url.includes('/asset-management/safety-ranges') ||
      url.includes('/asset-management/operational-parameters') ||
      url.includes('/maintenance')
    );
  }
}
