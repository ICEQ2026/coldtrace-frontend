import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-temperature-gauge',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './temperature-gauge.html',
  styleUrl: './temperature-gauge.css',
})
export class TemperatureGauge {
  @Input() temperature: number | null = null;
  @Input() humidity: number | null = null;
  @Input() sensorId = 'N/A';
  @Input() location = 'N/A';
  @Input() lastReadingTime = 'N/A';
  @Input() assetName = 'N/A';
  @Input() minTemp: number | null = null;
  @Input() maxTemp: number | null = null;

  get hasTemperature(): boolean {
    return this.temperature !== null && Number.isFinite(this.temperature);
  }

  get hasHumidity(): boolean {
    return this.humidity !== null && Number.isFinite(this.humidity);
  }

  get gaugeColor(): string {
    if (!this.hasTemperature || !this.hasTemperatureRange) return '#CBD5E1';
    if (this.temperature! > this.maxTemp!) return '#EF4444';
    if (this.temperature! < this.minTemp!) return '#3B82F6';
    return '#22C55E';
  }

  get dashArray(): string {
    const totalLength = 240;
    const minTemp = this.hasTemperatureRange ? this.minTemp! : this.displayMinimumTemperature;
    const maxTemp = this.hasTemperatureRange ? this.maxTemp! : this.displayMaximumTemperature;
    const range = Math.max(maxTemp - minTemp, 1);
    const gaugeTemperature = this.hasTemperature ? this.temperature! : minTemp;
    const normalized = Math.min(Math.max(gaugeTemperature - minTemp, 0), range);
    const percentage = normalized / range;
    const filled = percentage * totalLength;
    return `${filled} ${totalLength}`;
  }

  get temperatureText(): string {
    return this.hasTemperature ? `${this.temperature!.toFixed(1)}°C` : 'N/A';
  }

  private get hasTemperatureRange(): boolean {
    return (
      this.minTemp !== null &&
      this.maxTemp !== null &&
      Number.isFinite(this.minTemp) &&
      Number.isFinite(this.maxTemp) &&
      this.minTemp < this.maxTemp
    );
  }

  private get displayMinimumTemperature(): number {
    return this.hasTemperature ? Math.floor(this.temperature! - 1) : 0;
  }

  private get displayMaximumTemperature(): number {
    return this.hasTemperature ? Math.ceil(this.temperature! + 1) : 1;
  }
}
