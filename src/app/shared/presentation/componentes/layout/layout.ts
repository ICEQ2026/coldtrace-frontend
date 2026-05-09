import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    LanguageSwitcher
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  private readonly router = inject(Router);

  protected readonly currentUrl = signal(this.router.url);
  private readonly shellRoutePaths = [
    '/identity-access/dashboard',
    '/identity-access/assets',
    '/identity-access/alerts',
    '/identity-access/monitoring',
    '/identity-access/reports',
    '/identity-access/roles-permissions',
  ];
  protected readonly showLanguageSwitcher = computed(() => {
    return !this.shellRoutePaths.some(path => this.currentUrl().includes(path));
  });

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.currentUrl.set(event.urlAfterRedirects));
  }
}
