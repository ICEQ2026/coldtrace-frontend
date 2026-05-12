import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { RecentAlert } from '../../../domain/model/recent-alert.entity';

@Component({
  selector: 'app-recent-alerts',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './recent-alerts.html',
  styleUrl: './recent-alerts.css'
})
export class RecentAlerts {
  @Input() alerts: RecentAlert[] = [];

  protected statusLabelKey(status: RecentAlert['status']): string {
    return status === 'Unacknowledged'
      ? 'monitoring.operational.status-unack'
      : 'monitoring.operational.status-ack';
  }
}
