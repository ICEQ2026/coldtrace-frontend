import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcher],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.css',
})
export class DashboardShell {
  @Input() activeOrganizationName = 'ColdTrace';
  @Input() pageTitleKey = '';
  @Input() profileUserName = 'ColdTrace';
  @Input() profileRoleLabelKey = 'roles-permissions.roles.unassigned';
  @Input() canManageAccess = false;
  @Input() assetIssuesCount = 0;

  @Output() signedOut = new EventEmitter<void>();
  @Output() monthlyReportRequested = new EventEmitter<void>();

  protected accessDropdownOpen = false;
  protected accessDropdownTouched = false;
  protected reportsDropdownOpen = false;
  protected reportsDropdownTouched = false;

  protected isAccessDropdownOpen(isActive: boolean): boolean {
    return this.accessDropdownTouched ? this.accessDropdownOpen : isActive;
  }

  protected isReportsDropdownOpen(isActive: boolean): boolean {
    return this.reportsDropdownTouched ? this.reportsDropdownOpen : isActive;
  }

  protected toggleAccessDropdown(isActive: boolean): void {
    this.accessDropdownOpen = !this.isAccessDropdownOpen(isActive);
    this.accessDropdownTouched = true;
  }

  protected toggleReportsDropdown(isActive: boolean): void {
    this.reportsDropdownOpen = !this.isReportsDropdownOpen(isActive);
    this.reportsDropdownTouched = true;
  }

  protected logout(): void {
    this.signedOut.emit();
  }

  protected requestMonthlyReport(): void {
    this.monthlyReportRequested.emit();
  }
}
