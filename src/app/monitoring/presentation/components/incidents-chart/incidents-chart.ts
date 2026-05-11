import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { IncidentDay } from '../../../domain/model/incident-day.entity';

Chart.register(...registerables);

@Component({
  selector: 'app-incidents-chart',
  imports: [MatIconModule, TranslateModule],
  templateUrl: './incidents-chart.html',
  styleUrl: './incidents-chart.css'
})
export class IncidentsChart implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasElement') private canvas!: ElementRef<HTMLCanvasElement>;

  @Input() days: IncidentDay[] = [];
  @Input() timeline: IncidentDay[] = [];

  private chart?: Chart;

  get normalTotal(): number { return this.days.reduce((sum, day) => sum + day.normal, 0); }
  get warningTotal(): number { return this.days.reduce((sum, day) => sum + day.warning, 0); }
  get criticalTotal(): number { return this.days.reduce((sum, day) => sum + day.critical, 0); }
  get offlineTotal(): number { return Math.max(1, Math.round(this.days.reduce((sum, day) => sum + day.offline, 0) / Math.max(this.days.length * 4, 1))); }
  get averageIncidents(): string {
    const total = this.days.reduce((sum, day) => sum + day.warning + day.critical, 0);
    const average = (total / Math.max(this.days.length, 1)) + this.offlineTotal;
    return average.toFixed(1).replace('.0', '');
  }

  ngAfterViewInit(): void { this.buildChart(); }
  ngOnChanges(): void { this.buildChart(); }
  ngOnDestroy(): void { this.chart?.destroy(); }

  microHeight(day: IncidentDay): number {
    return Math.max(4, Math.min(36, day.normal + day.warning + day.critical + day.offline));
  }

  private buildChart(): void {
    if (!this.canvas?.nativeElement) return;
    this.chart?.destroy();
    this.chart = undefined;

    if (!this.days.length) return;

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.days.map(day => day.label),
        datasets: [
          { label: 'Normal', data: this.days.map(day => day.normal), backgroundColor: '#5bbf7f', borderRadius: 2, barPercentage: 0.42, categoryPercentage: 0.72 },
          { label: 'Warning', data: this.days.map(day => day.warning), backgroundColor: '#f2b646', borderRadius: 2, barPercentage: 0.42, categoryPercentage: 0.72 },
          { label: 'Critical', data: this.days.map(day => day.critical), backgroundColor: '#ed5145', borderRadius: 2, barPercentage: 0.42, categoryPercentage: 0.72 },
          { label: 'Offline', data: this.days.map(day => day.offline), backgroundColor: '#e8ecf2', borderRadius: 2, barPercentage: 0.42, categoryPercentage: 0.72 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { stacked: true, grid: { color: 'rgba(148,163,184,0.16)', drawTicks: false }, border: { color: 'rgba(148,163,184,0.18)' }, ticks: { color: '#AEB7C6', font: { family: 'Inter', size: 11, weight: '800' as any } } },
          y: { stacked: true, min: 0, max: 16, grid: { color: 'rgba(148,163,184,0.16)', drawTicks: false }, border: { color: 'rgba(148,163,184,0.18)' }, ticks: { display: false } }
        }
      }
    });
  }
}
