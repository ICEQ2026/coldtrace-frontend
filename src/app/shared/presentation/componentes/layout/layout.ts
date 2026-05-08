import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
export class Layout {}
