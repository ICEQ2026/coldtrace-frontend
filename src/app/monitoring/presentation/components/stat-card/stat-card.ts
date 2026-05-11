import { Component, Input } from '@angular/core';
import { NgStyle, NgIf, NgFor, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

interface StatCardColor {
  bg: string;
  border: string;
  text: string;
  chart: string;
  chartLight?: string;
}

export interface StatCardTooltip {
  text: string;
  position: number;
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgStyle, NgIf, NgFor, NgClass, MatIconModule, TranslateModule],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css'
})
export class StatCard {
  @Input() title = '';
  @Input() value = '';
  @Input() valueUnit = '';
  @Input() trend = '';
  @Input() type: 'bars' | 'wave' = 'bars';
  @Input() size: 'large' | 'small' = 'small';
  @Input() color: StatCardColor = {
    bg: '#ffffff',
    border: '#e5e7eb',
    text: '#1a1a1a',
    chart: '#33bfff'
  };
  @Input() tooltip?: StatCardTooltip;
  @Input() chartData: number[] = [];
  @Input() highlightedBar = -1;
  @Input() showAnchor = true;
  @Input() fillWave = false;
  @Input() waveFillColor = 'rgba(255,255,255,0.24)';
  @Input() wavePath = '';
  @Input() waveFillPath = '';

  get fadedOpacity(): string {
    return this.size === 'large' ? '0.42' : '0.55';
  }

  get trendOpacity(): string {
    return this.size === 'small' ? '0.82' : '0.6';
  }

  get unitOpacity(): string {
    return this.size === 'small' ? '0.92' : '0.8';
  }

  get bubbleTextColor(): string {
    return this.color.text.toLowerCase() === '#ffffff' ? this.color.bg : this.color.text;
  }
}
