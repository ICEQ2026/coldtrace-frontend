import { Component, inject } from '@angular/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  imports: [
    MatButtonToggle,
    MatButtonToggleGroup
  ],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcher {
  protected currentLang: string;
  protected languages: string[];
  private translate: TranslateService;

  constructor() {
    this.translate = inject(TranslateService);
    this.currentLang = this.translate.getCurrentLang() || 'en';
    this.languages = [...this.translate.getLangs()];
  }

  useLanguage(language: string) {
    this.translate.use(language);
    this.currentLang = language;
  }

  protected flagFor(language: string): string {
    return `icons/flag-${language}.svg`;
  }

  protected labelFor(language: string): string {
    return language.toUpperCase();
  }
}
