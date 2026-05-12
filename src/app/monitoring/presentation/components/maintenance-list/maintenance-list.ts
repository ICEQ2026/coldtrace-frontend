import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { MaintenanceTask } from '../../../domain/model/maintenance-task.entity';

@Component({
  selector: 'app-maintenance-list',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './maintenance-list.html',
  styleUrl: './maintenance-list.css'
})
export class MaintenanceList {
  @Input() tasks: MaintenanceTask[] = [];
  @Input() completionRate = 78;

  get progressDashArray(): string {
    const circumference = 264;
    const completed = Math.round((this.completionRate / 100) * circumference);
    return completed + ' ' + circumference;
  }
}
