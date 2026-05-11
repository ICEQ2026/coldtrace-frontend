import { Injectable } from '@angular/core';
import { AssetSettings } from '../../../asset-management/domain/model/asset-settings.entity';

@Injectable({ providedIn: 'root' })
export class ThermalSeverityService {
  /**
   * Determines the severity level based on temperature and organization settings.
   * Logic: 
   * - Critical: Temperature is more than 2 degrees above max or below min.
   * - Warning: Temperature is out of range but within the 2-degree critical buffer.
   * - Normal: Temperature is within range.
   */
  getSeverity(temperature: number, settings: AssetSettings | null): 'normal' | 'warning' | 'critical' {
    if (!settings) return 'normal';
    
    const maxTemp = settings.maximumTemperature;
    const minTemp = settings.minimumTemperature;

    if (temperature > (maxTemp + 2) || temperature < (minTemp - 2)) {
      return 'critical';
    }

    if (temperature > maxTemp || temperature < minTemp) {
      return 'warning';
    }

    return 'normal';
  }

  /**
   * Gets the appropriate icon for a temperature reading.
   */
  getIcon(temperature: number, settings: AssetSettings | null): string {
    if (!settings) return 'device_thermostat';
    return temperature > settings.maximumTemperature ? 'device_thermostat' : 'ac_unit';
  }
}
