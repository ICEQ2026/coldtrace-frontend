import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-dashboard-shell',
  imports: [LanguageSwitcher, MatIcon, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.css',
})
export class DashboardShell {
  @Input() activeOrganizationName = 'ColdTrace';
  @Input() pageTitleKey = '';
  @Input() profileUserName = 'ColdTrace';
  @Input() profileRoleLabelKey = 'roles-permissions.roles.unassigned';
  @Input() canManageAccess = false;

  @Output() signedOut = new EventEmitter<void>();

  protected logout(): void {
    this.signedOut.emit();
  }
}
