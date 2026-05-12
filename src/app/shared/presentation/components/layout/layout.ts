import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, interval } from 'rxjs';
import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { MonitoringStore } from '../../../../monitoring/application/monitoring.store';
import { ReportsStore } from '../../../../reports/application/reports.store';
import { MonthlyReport } from '../../../../reports/domain/model/monthly-report.entity';
import { TELEMETRY_POLLING_INTERVAL_MS } from '../../../domain/model/polling-interval.constant';
import { DashboardShell } from '../dashboard-shell/dashboard-shell';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, LanguageSwitcher, DashboardShell],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly identityAccessStore = inject(IdentityAccessStore);
  private readonly assetManagementStore = inject(AssetManagementStore);
  private readonly monitoringStore = inject(MonitoringStore);
  private readonly reportsStore = inject(ReportsStore);

  protected readonly currentUrl = signal(this.router.url);
  private readonly dashboardRoutePaths = [
    '/identity-access/dashboard',
    '/asset-management/assets',
    '/identity-access/alerts',
    '/identity-access/monitoring',
    '/identity-access/reports',
    '/identity-access/users',
    '/identity-access/roles-permissions',
    '/monitoring',
    '/reports',
  ];

  protected readonly showDashboardShell = computed(() => {
    return this.dashboardRoutePaths.some((path) => this.currentUrl().includes(path));
  });

  protected readonly showLanguageSwitcher = computed(() => {
    return !this.showDashboardShell();
  });

  protected readonly pageTitleKey = computed(() => {
    const currentUrl = this.currentUrl();

    if (currentUrl.includes('/asset-management/assets')) {
      return 'asset-management.title';
    }

    if (currentUrl.includes('/monitoring')) {
      return 'monitoring.operational.title';
    }

    if (currentUrl.includes('/identity-access/roles-permissions/users/new')) {
      return 'roles-permissions.create-user-page-title';
    }

    if (currentUrl.includes('/identity-access/roles-permissions/permissions')) {
      return 'roles-permissions.permissions-page-title';
    }

    if (
      currentUrl.includes('/identity-access/roles-permissions') ||
      currentUrl.includes('/identity-access/users')
    ) {
      return 'roles-permissions.title';
    }

    if (currentUrl.includes('/identity-access/alerts')) {
      return 'roles-permissions.alerts-page-title';
    }

    if (currentUrl.includes('/reports/history')) {
      return 'reports.history.page-title';
    }

    if (currentUrl.includes('/reports/monthly')) {
      return 'reports.monthly.page-title';
    }

    if (currentUrl.includes('/reports/compliance')) {
      return 'reports.compliance.page-title';
    }

    if (currentUrl.includes('/identity-access/reports') || currentUrl.includes('/reports')) {
      return 'reports.daily-log.page-title';
    }

    return 'roles-permissions.main-page-title';
  });

  protected readonly activeOrganizationId = computed(() => {
    return this.identityAccessStore.currentOrganizationIdFrom(this.identityAccessStore.users());
  });

  protected readonly activeOrganizationName = computed(() => {
    return this.identityAccessStore.currentOrganizationNameFrom(
      this.identityAccessStore.users(),
      this.identityAccessStore.organizations(),
    );
  });

  protected readonly profileUserName = computed(() => {
    return this.identityAccessStore.currentUserNameFrom(this.identityAccessStore.users());
  });

  protected readonly profileRoleLabelKey = computed(() => {
    return this.identityAccessStore.currentRoleLabelKeyFrom(
      this.identityAccessStore.users(),
      this.identityAccessStore.roles(),
    );
  });

  protected readonly canManageAccess = computed(() => {
    return this.identityAccessStore.canManageAccess(
      this.identityAccessStore.users(),
      this.identityAccessStore.roles(),
    );
  });

  private readonly currentRole = computed(() => {
    return this.identityAccessStore.currentRoleFrom(
      this.identityAccessStore.users(),
      this.identityAccessStore.roles(),
    );
  });

  private readonly canDownloadReports = computed(() => {
    return this.identityAccessStore
      .permissionKeysForRole(this.currentRole())
      .includes('roles-permissions.permissions.view-reports');
  });

  protected readonly assetIssueCount = computed(() => {
    return this.assetManagementStore.assetIssueCountFor(this.activeOrganizationId());
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  ngOnInit(): void {
    this.loadShellData();
    this.startTelemetryUpdates();
  }

  protected logout(): void {
    this.identityAccessStore.clearCurrentUser();
    void this.router.navigate(['/identity-access/sign-in']);
  }

  protected downloadCurrentMonthReport(): void {
    if (!this.canDownloadReports()) {
      void this.router.navigate(['/reports/monthly']);
      return;
    }

    const month = this.reportsStore.currentDate().slice(0, 7);
    const monthlyReport = this.reportsStore.buildMonthlyReport(this.activeOrganizationId(), month);

    if (!monthlyReport.canDownload) {
      void this.router.navigate(['/reports/monthly']);
      return;
    }

    this.reportsStore
      .createMonthlySummaryReport(this.activeOrganizationId(), monthlyReport)
      .subscribe({
        next: () => this.downloadMonthlyCsv(monthlyReport),
        error: () => void this.router.navigate(['/reports/monthly']),
      });
  }

  private loadShellData(): void {
    this.identityAccessStore.loadUsers();
    this.identityAccessStore.loadOrganizations();
    this.identityAccessStore.loadRoles();
    this.assetManagementStore.loadAssets();
    this.assetManagementStore.loadIoTDevices();
    this.assetManagementStore.loadGateways();
    this.assetManagementStore.loadAssetSettings();
    this.monitoringStore.loadReadings();
    this.reportsStore.loadReports();
  }

  private startTelemetryUpdates(): void {
    interval(TELEMETRY_POLLING_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.showDashboardShell()) {
          this.assetManagementStore.updateOrganizationTelemetry(this.activeOrganizationId());
        }
      });
  }

  private downloadMonthlyCsv(monthlyReport: MonthlyReport): void {
    const csv = this.reportsStore.monthlyReportCsv(monthlyReport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const organizationSlug = this.fileNamePart(this.activeOrganizationName());

    link.href = url;
    link.download = `${organizationSlug}-monthly-report-${monthlyReport.month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private fileNamePart(value: string): string {
    return (
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'organization'
    );
  }
}
