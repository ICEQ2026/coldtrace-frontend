import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { AlertsStore } from '../../../application/alerts.store';
import { IncidentDetail } from '../incident-detail/incident-detail';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule, IncidentDetail],
  templateUrl: './alerts-list.html',
  styleUrl: './alerts-list.css',
})
export class AlertsList implements OnInit {
  private alertsStore = inject(AlertsStore);
  
  incidents = this.alertsStore.incidents;
  loading = this.alertsStore.loading;
  selectedIncidentId: number | null = null;

  ngOnInit(): void {
    this.alertsStore.loadIncidents();
  }

  onSelectIncident(id: number): void {
    this.selectedIncidentId = id;
  }

  onCloseDetail(): void {
    this.selectedIncidentId = null;
  }
}
