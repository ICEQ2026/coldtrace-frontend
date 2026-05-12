import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Incident } from '../../../domain/model/incident.entity';
import { CorrectiveAction } from '../../../domain/model/corrective-action.entity';
import { AlertsStore } from '../../../application/alerts.store';
import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';
import { Asset } from '../../../../asset-management/domain/model/asset.entity';
import { CorrectiveActionForm } from '../corrective-action-form/corrective-action-form';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, CorrectiveActionForm],
  templateUrl: './incident-detail.html',
  styleUrl: './incident-detail.css',
})
export class IncidentDetail implements OnInit {
  @Input() incidentId!: number;

  incident: Incident | undefined;
  assetName = '';
  isCriticalCondition = false;
  showForm = false;
  loading = false;

  private alertsStore = inject(AlertsStore);
  private assetStore = inject(AssetManagementStore);

  constructor() {}

  ngOnInit(): void {
    this.loadIncident();
  }

  loadIncident(): void {
    this.incident = this.alertsStore.incidents().find((i) => i.id === this.incidentId);
    if (this.incident) {
      const asset = this.assetStore.assets().find((a: Asset) => a.id === this.incident?.assetId);
      this.assetName = asset?.name || `Asset #${this.incident.assetId}`;
      
      // Check if condition is still critical (simulated logic based on asset status/telemetry)
      this.isCriticalCondition = asset?.lastIncident !== 'none';
    }
  }

  onOpenForm(): void {
    this.showForm = true;
  }

  onCloseForm(): void {
    this.showForm = false;
  }

  onResolve(action: CorrectiveAction): void {
    this.loading = true;
    this.alertsStore.resolveIncident(this.incidentId, action).subscribe({
      next: () => {
        this.loading = false;
        this.showForm = false;
        this.loadIncident();
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
