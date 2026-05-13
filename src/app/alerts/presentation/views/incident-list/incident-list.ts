import { Component, computed, effect, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { AlertsStore } from '../../../application/alerts.store';
import { Incident } from '../../../domain/model/incident.entity';

/**
 * @summary Presents the incident list user interface in the alerts bounded context.
 */
@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [TranslateModule, MatIconModule, MatProgressSpinnerModule, ReactiveFormsModule],
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.css',
})
export class IncidentList implements OnInit {
  protected readonly alertsStore = inject(AlertsStore);
  private readonly identityStore = inject(IdentityAccessStore);
  private readonly fb = inject(FormBuilder);
  @ViewChild('closureCard') private closureCard?: ElementRef<HTMLElement>;
  protected readonly closureSubmitted = signal(false);
  protected readonly canResolveAlerts = computed(() => this.alertsStore.canResolveAlerts());
  protected readonly profileUserName = computed(() =>
    this.identityStore.currentUserNameFrom(this.identityStore.users()),
  );
  protected readonly activeIncidents = computed(() =>
    this.alertsStore.incidents().filter((incident) => !incident.isClosed),
  );
  protected readonly pendingClosureIncidents = computed(() => this.activeIncidents());

  protected readonly closureForm = this.fb.nonNullable.group({
    incidentId: [0, [Validators.required, Validators.min(1)]],
    correctiveAction: ['', [Validators.required, Validators.minLength(8)]],
    closureEvidence: ['', [Validators.required, Validators.minLength(8)]],
  });
  private readonly selectedClosureIncidentId = toSignal(
    this.closureForm.controls.incidentId.valueChanges,
    { initialValue: 0 },
  );
  protected readonly selectedClosureIncident = computed(() => {
    const selectedId = Number(this.selectedClosureIncidentId());
    return this.pendingClosureIncidents().find((incident) => incident.id === selectedId) ?? null;
  });

  private readonly defaultClosureSelection = effect(() => {
    const pendingIncidents = this.pendingClosureIncidents();
    const selectedId = Number(this.closureForm.controls.incidentId.value);
    const selectedStillAvailable = pendingIncidents.some((incident) => incident.id === selectedId);

    if (!selectedStillAvailable) {
      this.closureForm.controls.incidentId.setValue(pendingIncidents[0]?.id ?? 0);
    }
  });

  /**
   * @summary Initializes the incident list view state.
   */
  ngOnInit(): void {
    this.alertsStore.loadIncidents();
  }

  protected recognize(incident: Incident): void {
    if (!incident.isOpen || this.alertsStore.recognizingId() === incident.id) {
      return;
    }
    const userName = this.profileUserName();
    this.alertsStore.recognizeIncident(incident, userName).subscribe({
      error: () => undefined,
    });
  }

  protected closeIncident(): void {
    this.closureSubmitted.set(true);
    this.alertsStore.clearFeedback();
    this.closureForm.markAllAsTouched();

    if (!this.canResolveAlerts()) {
      this.alertsStore.setFeedback('alerts.incident-list.feedback-access-denied');
      return;
    }

    if (this.closureForm.invalid) {
      this.alertsStore.setFeedback('alerts.incident-list.feedback-missing-evidence');
      return;
    }

    const incident = this.selectedClosureIncident();

    if (!incident) {
      this.alertsStore.setFeedback('alerts.incident-list.feedback-invalid-incident');
      return;
    }

    if (!incident.isConditionStable) {
      this.alertsStore.setFeedback('alerts.incident-list.feedback-condition-active');
      return;
    }

    this.alertsStore
      .closeIncident(
        incident,
        this.closureForm.controls.correctiveAction.value.trim(),
        this.closureForm.controls.closureEvidence.value.trim(),
        this.profileUserName(),
      )
      .subscribe({
        next: () => {
          this.closureSubmitted.set(false);
          this.closureForm.reset({
            incidentId: this.pendingClosureIncidents()[0]?.id ?? 0,
            correctiveAction: '',
            closureEvidence: '',
          });
          this.closureForm.markAsPristine();
        },
        error: () => undefined,
      });
  }

  protected reviewEscalation(incident: Incident): void {
    if (
      this.alertsStore.reviewingEscalationId() === incident.id ||
      (!incident.isEscalated && !incident.isPendingEscalationConfiguration)
    ) {
      return;
    }

    this.alertsStore.reviewEscalation(incident, this.profileUserName()).subscribe({
      error: () => undefined,
    });
  }

  protected selectIncidentForClosure(incident: Incident): void {
    if (incident.isClosed) {
      return;
    }

    this.closureForm.controls.incidentId.setValue(incident.id);
    this.alertsStore.clearFeedback();
    queueMicrotask(() => this.closureCard?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    }));
  }

  protected stabilizeSelectedIncident(): void {
    const incident = this.selectedClosureIncident();

    if (!incident || incident.isConditionStable || this.alertsStore.stabilizingId() === incident.id) {
      return;
    }

    this.alertsStore.stabilizeIncident(incident).subscribe({
      error: () => undefined,
    });
  }

  protected hasClosureControlError(
    controlName: keyof typeof this.closureForm.controls,
  ): boolean {
    const control = this.closureForm.controls[controlName];
    return control.invalid && (control.touched || this.closureSubmitted());
  }

  protected statusLabelKey(incident: Incident): string {
    switch (incident.status) {
      case 'recognized': return 'alerts.incident-list.status-recognized';
      case 'closed': return 'alerts.incident-list.status-closed';
      default: return 'alerts.incident-list.status-open';
    }
  }

  protected escalationLabelKey(incident: Incident): string {
    return `alerts.incident-list.escalation-${incident.escalationStatus}`;
  }

  protected escalationTargetLabelKey(incident: Incident): string {
    return incident.escalatedTo
      ? `alerts.incident-list.escalation-target-${incident.escalatedTo}`
      : 'alerts.incident-list.escalation-target-none';
  }

  protected isSuccessFeedback(feedback: string): boolean {
    return [
      'alerts.incident-list.feedback-recognized',
      'alerts.incident-list.feedback-closed',
      'alerts.incident-list.feedback-escalation-reviewed',
    ].includes(feedback);
  }

  protected severityIcon(incident: Incident): string {
    return incident.severity === 'critical' ? 'error' : 'warning';
  }

  protected conditionLabelKey(incident: Incident): string {
    return incident.isConditionStable
      ? 'alerts.incident-list.condition-stable'
      : 'alerts.incident-list.condition-active';
  }

  protected sourceLabelKey(incident: Incident): string {
    if (incident.isPendingReview) {
      return 'alerts.incident-list.source-pending-review';
    }

    if (incident.isGenerated) {
      return 'alerts.incident-list.source-generated';
    }

    return 'alerts.incident-list.source-initial';
  }

  protected typeLabelKey(incident: Incident): string {
    return `alerts.incident-list.type-${incident.type}`;
  }

  protected formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  }
}
