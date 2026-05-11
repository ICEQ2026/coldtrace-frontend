import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { TemperaturePoint } from '../../../domain/model/temperature-point.entity';

Chart.register(...registerables);

@Component({
  selector: 'app-temperature-chart',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './temperature-chart.html',
  styleUrl: './temperature-chart.css'
})
export class TemperatureChart implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasElement') private canvas!: ElementRef<HTMLCanvasElement>;

  @Input() title = 'Temperature';
  @Input() subtitle = 'Last 24h · Cold Room 01';
  @Input() points: TemperaturePoint[] = [];

  private chart?: Chart;

  ngAfterViewInit(): void { this.buildChart(); }
  ngOnChanges(): void { this.buildChart(); }
  ngOnDestroy(): void { this.chart?.destroy(); }

  private buildChart(): void {
    if (!this.canvas?.nativeElement) return;
    this.chart?.destroy();

    if (!this.points.length) {
      this.chart?.destroy();
      this.chart = undefined;
      return;
    }

    const dashboardPoints = this.points;
    const labels = dashboardPoints.map(point => point.label);
    const temperatures = dashboardPoints.map(point => point.temperature);
    const ghostData = dashboardPoints.map(point => point.ghost);
    const maxLimit = dashboardPoints[0]?.maxLimit ?? 7.2;
    const minLimit = dashboardPoints[0]?.minLimit ?? -5;

    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const getStopForValue = (value: number, chart: Chart) => {
      const { chartArea, scales: { y } } = chart;
      if (!chartArea) return 0;
      const pixel = y.getPixelForValue(value);
      return Math.max(0, Math.min(1, (pixel - chartArea.top) / (chartArea.bottom - chartArea.top)));
    };

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Ghost Line', data: ghostData, borderColor: 'rgba(96, 165, 250, 0.42)', borderDash: [3, 3], borderWidth: 1.4, pointRadius: 0, fill: false, tension: 0.48, order: 4 },
          {
            label: 'Temperature Area',
            data: temperatures,
            borderColor: 'transparent',
            backgroundColor: context => {
              const chart = context.chart;
              const { ctx: canvasCtx, chartArea } = chart;
              if (!chartArea) return 'rgba(34, 197, 94, 0.28)';

              const maxStop = getStopForValue(maxLimit, chart);
              const minStop = getStopForValue(minLimit, chart);
              const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

              gradient.addColorStop(0, 'rgba(34, 197, 94, 0)');
              gradient.addColorStop(maxStop, 'rgba(34, 197, 94, 0)');
              gradient.addColorStop(maxStop, 'rgba(34, 197, 94, 0.48)');
              gradient.addColorStop(minStop, 'rgba(34, 197, 94, 0.12)');
              gradient.addColorStop(minStop, 'rgba(34, 197, 94, 0)');
              gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
              return gradient;
            },
            fill: { target: { value: minLimit } } as any,
            tension: 0.42,
            pointRadius: 0,
            borderWidth: 0,
            order: 1
          },
          {
            label: 'Above Max',
            data: temperatures,
            borderColor: 'transparent',
            backgroundColor: context => {
              const chart = context.chart;
              const { ctx: canvasCtx, chartArea } = chart;
              if (!chartArea) return 'rgba(239, 68, 68, 0.22)';

              const maxStop = getStopForValue(maxLimit, chart);
              const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

              gradient.addColorStop(0, 'rgba(239, 68, 68, 0.48)');
              gradient.addColorStop(maxStop, 'rgba(239, 68, 68, 0.22)');
              gradient.addColorStop(maxStop, 'rgba(239, 68, 68, 0)');
              gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
              return gradient;
            },
            fill: { target: { value: maxLimit } } as any,
            tension: 0.42,
            pointRadius: 0,
            borderWidth: 0,
            order: 2
          },
          {
            label: 'Below Min',
            data: temperatures,
            borderColor: 'transparent',
            backgroundColor: context => {
              const chart = context.chart;
              const { ctx: canvasCtx, chartArea } = chart;
              if (!chartArea) return 'rgba(59, 130, 246, 0.2)';

              const minStop = getStopForValue(minLimit, chart);
              const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

              gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
              gradient.addColorStop(minStop, 'rgba(59, 130, 246, 0)');
              gradient.addColorStop(minStop, 'rgba(59, 130, 246, 0.22)');
              gradient.addColorStop(1, 'rgba(59, 130, 246, 0.48)');
              return gradient;
            },
            fill: { target: { value: minLimit } } as any,
            tension: 0.42,
            pointRadius: 0,
            borderWidth: 0,
            order: 2
          },
          {
            label: 'Temperature Line',
            data: temperatures,
            borderColor: '#22c55e',
            fill: false,
            tension: 0.42,
            pointRadius: 0,
            borderWidth: 1.4,
            order: 5,
            segment: {
              borderColor: context => {
                const y0 = context.p0.parsed.y ?? 0;
                const y1 = context.p1.parsed.y ?? 0;
                if (y0 < minLimit || y1 < minLimit) return '#7aa7ff';
                if (y0 > maxLimit || y1 > maxLimit) return '#ef8d8d';
                return '#22c55e';
              }
            }
          },
          { label: 'Max Limit', data: new Array(labels.length).fill(maxLimit), borderColor: 'rgba(239, 68, 68, 0.78)', borderDash: [3, 4], borderWidth: 1.2, pointRadius: 0, fill: false, order: 6 },
          { label: 'Min Limit', data: new Array(labels.length).fill(minLimit), borderColor: 'rgba(91, 125, 255, 0.68)', borderDash: [3, 4], borderWidth: 1.2, pointRadius: 0, fill: false, order: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: '#9CA3AF',
              font: { family: 'Inter', size: 11, weight: '600' as any },
              maxRotation: 0,
              autoSkip: false,
              callback: function (_value, index) { return index % 4 === 0 ? labels[index] : ''; }
            }
          },
          y: {
            min: -10,
            max: 13,
            grid: { color: 'rgba(15,23,42,0.045)', drawTicks: false },
            border: { display: false },
            ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 10, weight: '500' as any }, stepSize: 5, padding: 8 }
          }
        }
      }
    });
  }
}
