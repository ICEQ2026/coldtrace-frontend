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

/**
 * @summary Presents the stat card tooltip user interface in the monitoring bounded context.
 */
export interface StatCardTooltip {
  text: string;
  position: number;
}

const CRITICAL_ALERTS_WAVE_PATH =
  'M0 32 C 6 35, 11 36, 17 31 C 23 24, 29 33, 35 34 C 42 35, 46 22, 52 25 C 56 28, 58 18, 64 20 C 70 23, 73 31, 79 27 C 84 24, 86 16, 93 15 C 96 15, 98 17, 100 16';
const CRITICAL_ALERTS_WAVE_FILL_PATH = `${CRITICAL_ALERTS_WAVE_PATH} L100 40 L0 40 Z`;
const CRITICAL_ALERTS_WAVE_FILL_COLOR = 'rgba(61, 12, 116, 0.16)';

/**
 * @summary Presents the stat card user interface in the monitoring bounded context.
 */
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

  protected readonly wavePath = CRITICAL_ALERTS_WAVE_PATH;
  protected readonly waveFillPath = CRITICAL_ALERTS_WAVE_FILL_PATH;
  protected readonly waveFillColor = CRITICAL_ALERTS_WAVE_FILL_COLOR;

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
