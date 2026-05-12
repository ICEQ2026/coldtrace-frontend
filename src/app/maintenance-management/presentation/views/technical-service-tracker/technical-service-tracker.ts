import { NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { AssetManagementStore } from '../../../../asset-management/application/asset-management.store';
import { AssetStatus } from '../../../../asset-management/domain/model/asset-status.enum';
import { Asset } from '../../../../asset-management/domain/model/asset.entity';
import { AssetManagementApi } from '../../../../asset-management/infrastructure/asset-management-api';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { Organization } from '../../../../identity-access/domain/model/organization.entity';
import { Role } from '../../../../identity-access/domain/model/role.entity';
import { User } from '../../../../identity-access/domain/model/user.entity';
import { IdentityAccessApi } from '../../../../identity-access/infrastructure/identity-access-api';
import { MaintenanceManagementStore } from '../../../application/maintenance-management.store';
import { TechnicalServiceRequest } from '../../../domain/model/technical-service-request.entity';
import { TechnicalServiceStatus } from '../../../domain/model/technical-service-status.enum';
import { MaintenanceManagementApi } from '../../../infrastructure/maintenance-management-api';

type TechnicalServiceFeedback =
  | 'idle'
  | 'request-created'
  | 'closed'
  | 'invalid'
  | 'invalid-asset'
  | 'missing-evidence'
  | 'failed-test'
  | 'access-denied'
  | 'server-error';

@Component({
  selector: 'app-technical-service-tracker',
  imports: [MatButton, MatIcon, MatProgressSpinner, NgClass, ReactiveFormsModule, TranslatePipe],
  templateUrl: './technical-service-tracker.html',
  styleUrl: './technical-service-tracker.css',
})
export class TechnicalServiceTracker implements OnInit {
  protected readonly identityAccessStore = inject(IdentityAccessStore);
  protected readonly assetManagementStore = inject(AssetManagementStore);
  protected readonly maintenanceStore = inject(MaintenanceManagementStore);
  private readonly identityAccessApi = inject(IdentityAccessApi);
  private readonly assetManagementApi = inject(AssetManagementApi);
  private readonly maintenanceManagementApi = inject(MaintenanceManagementApi);
  private readonly fb = inject(FormBuilder);

  protected readonly today = this.localDateValue(new Date());
  protected readonly identityLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly requestSubmitted = signal(false);
  protected readonly closureSubmitted = signal(false);
  protected readonly feedback = signal<TechnicalServiceFeedback>('idle');
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly assets = signal<Asset[]>([]);
  protected readonly technicalServiceRequests = signal<TechnicalServiceRequest[]>([]);

  protected readonly serviceRequestForm = this.fb.nonNullable.group({
    assetId: [0, [Validators.required, Validators.min(1)]],
    priority: ['medium', [Validators.required]],
    issueDescription: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly closureForm = this.fb.nonNullable.group({
    requestId: [0, [Validators.required, Validators.min(1)]],
    interventionNotes: ['', [Validators.required, Validators.minLength(8)]],
    resultNotes: ['', [Validators.required, Validators.minLength(8)]],
    functionalTestPassed: [true],
  });

  protected readonly loading = computed(() => this.identityLoading() || this.saving());
  protected readonly activeOrganizationId = computed(() => {
    return this.identityAccessStore.currentOrganizationIdFrom(this.users());
  });
  protected readonly activeOrganizationName = computed(() => {
    return this.identityAccessStore.currentOrganizationNameFrom(this.users(), this.organizations());
  });
  protected readonly currentRole = computed(() => {
    return this.identityAccessStore.currentRoleFrom(this.users(), this.roles());
  });
  protected readonly canManageTechnicalService = computed(() => {
    return this.identityAccessStore
      .permissionKeysForRole(this.currentRole())
      .includes('roles-permissions.permissions.manage-assets');
  });
  protected readonly organizationAssets = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.assets().filter((asset) => asset.organizationId === organizationId);
  });
  protected readonly serviceEligibleAssets = computed(() => {
    return this.organizationAssets().filter((asset) => {
      return asset.status === AssetStatus.Active || asset.status === AssetStatus.Maintenance;
    });
  });
  protected readonly organizationRequests = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.technicalServiceRequests()
      .filter((request) => request.organizationId === organizationId)
      .sort((a, b) => b.requestedDate.localeCompare(a.requestedDate));
  });
  protected readonly openRequests = computed(() => {
    return this.organizationRequests().filter((request) => this.isOpenRequest(request));
  });
  protected readonly pendingReviewRequests = computed(() => {
    return this.organizationRequests().filter(
      (request) => request.status === TechnicalServiceStatus.PendingReview,
    );
  });
  protected readonly closedRequests = computed(() => {
    return this.organizationRequests().filter(
      (request) => request.status === TechnicalServiceStatus.Closed,
    );
  });

  ngOnInit(): void {
    this.loadPageData();
  }

  protected loadPageData(): void {
    this.identityLoading.set(true);
    this.feedback.set('idle');
    this.maintenanceStore.loadTechnicalServiceRequests();

    forkJoin({
      users: this.identityAccessApi.getUsers(),
      roles: this.identityAccessApi.getRoles(),
      organizations: this.identityAccessApi.getOrganizations(),
      assets: this.assetManagementApi.getAssets(),
      technicalServiceRequests: this.maintenanceManagementApi.getTechnicalServiceRequests(),
    })
      .pipe(finalize(() => this.identityLoading.set(false)))
      .subscribe({
        next: ({ users, roles, organizations, assets, technicalServiceRequests }) => {
          this.users.set(users);
          this.roles.set(roles);
          this.organizations.set(organizations);
          this.assets.set(assets);
          this.technicalServiceRequests.set(technicalServiceRequests);
          this.identityAccessStore.setCurrentRoleFrom(users, roles);
          this.identityAccessStore.setCurrentOrganizationFrom(users, organizations);
          this.identityAccessStore.initializeRolePermissions(roles);
          this.resetRequestForm();
          this.resetClosureForm();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected requestTechnicalService(): void {
    this.requestSubmitted.set(true);
    this.feedback.set('idle');
    this.serviceRequestForm.markAllAsTouched();

    if (!this.canManageTechnicalService()) {
      this.feedback.set('access-denied');
      return;
    }

    if (this.serviceRequestForm.invalid) {
      this.feedback.set('invalid');
      return;
    }

    const organizationId = this.activeOrganizationId();
    const assetId = Number(this.serviceRequestForm.controls.assetId.value);
    const asset = this.serviceEligibleAssets().find((currentAsset) => currentAsset.id === assetId);

    if (!organizationId || !asset) {
      this.feedback.set('invalid-asset');
      return;
    }

    const nextRequestId = this.nextTechnicalServiceRequestId();
    const technicalServiceRequest = new TechnicalServiceRequest(
      nextRequestId,
      organizationId,
      this.generatedServiceUuid(nextRequestId),
      assetId,
      this.serviceRequestForm.controls.priority.value,
      this.serviceRequestForm.controls.issueDescription.value.trim(),
      this.today,
      TechnicalServiceStatus.Open,
      null,
      null,
      null,
      null,
    );

    this.saving.set(true);
    this.maintenanceStore
      .createTechnicalServiceRequest(technicalServiceRequest)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (createdRequest) => {
          this.technicalServiceRequests.update((requests) => [...requests, createdRequest]);
          this.feedback.set('request-created');
          this.requestSubmitted.set(false);
          this.resetRequestForm();
          this.resetClosureForm(createdRequest.id);
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected closeTechnicalService(): void {
    this.closureSubmitted.set(true);
    this.feedback.set('idle');
    this.closureForm.markAllAsTouched();

    if (!this.canManageTechnicalService()) {
      this.feedback.set('access-denied');
      return;
    }

    if (this.closureForm.invalid) {
      this.feedback.set('missing-evidence');
      return;
    }

    const requestId = Number(this.closureForm.controls.requestId.value);
    const request = this.openRequests().find((currentRequest) => currentRequest.id === requestId);

    if (!request) {
      this.feedback.set('invalid');
      return;
    }

    const functionalTestPassed = this.closureForm.controls.functionalTestPassed.value;
    const nextStatus = functionalTestPassed
      ? TechnicalServiceStatus.Closed
      : TechnicalServiceStatus.PendingReview;
    const updatedRequest = new TechnicalServiceRequest(
      request.id,
      request.organizationId,
      request.uuid,
      request.assetId,
      request.priority,
      request.issueDescription,
      request.requestedDate,
      nextStatus,
      this.closureForm.controls.interventionNotes.value.trim(),
      this.closureForm.controls.resultNotes.value.trim(),
      functionalTestPassed,
      functionalTestPassed ? this.today : null,
    );

    this.saving.set(true);
    this.maintenanceStore
      .updateTechnicalServiceRequest(updatedRequest)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (savedRequest) => {
          this.technicalServiceRequests.update((requests) =>
            requests.map((requestItem) =>
              requestItem.id === savedRequest.id ? savedRequest : requestItem,
            ),
          );
          this.feedback.set(functionalTestPassed ? 'closed' : 'failed-test');
          this.closureSubmitted.set(false);
          this.resetClosureForm();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected resetRequestForm(): void {
    const firstAsset = this.serviceEligibleAssets()[0];

    this.requestSubmitted.set(false);
    this.serviceRequestForm.reset({
      assetId: firstAsset?.id ?? 0,
      priority: 'medium',
      issueDescription: '',
    });
    this.serviceRequestForm.markAsPristine();
  }

  protected resetClosureForm(requestId = 0): void {
    const selectedRequestId = requestId || this.openRequests()[0]?.id || 0;

    this.closureSubmitted.set(false);
    this.closureForm.reset({
      requestId: selectedRequestId,
      interventionNotes: '',
      resultNotes: '',
      functionalTestPassed: true,
    });
    this.closureForm.markAsPristine();
  }

  protected hasRequestControlError(
    controlName: keyof typeof this.serviceRequestForm.controls,
  ): boolean {
    const control = this.serviceRequestForm.controls[controlName];

    return control.invalid && (control.touched || this.requestSubmitted());
  }

  protected hasClosureControlError(controlName: keyof typeof this.closureForm.controls): boolean {
    const control = this.closureForm.controls[controlName];

    return control.invalid && (control.touched || this.closureSubmitted());
  }

  protected assetNameFor(assetId: number): string {
    const asset = this.organizationAssets().find((currentAsset) => currentAsset.id === assetId);

    return asset ? `${asset.uuid} - ${asset.name}` : `#${assetId}`;
  }

  protected assetLocationFor(assetId: number): string {
    return this.organizationAssets().find((asset) => asset.id === assetId)?.location ?? 'N/A';
  }

  protected priorityKey(priority: string): string {
    return `maintenance.technical-service.priority.${priority}`;
  }

  protected requestStatusKey(status: TechnicalServiceStatus): string {
    return `maintenance.technical-service.status.${status}`;
  }

  protected requestStatusClass(status: TechnicalServiceStatus): string {
    const classByStatus: Record<TechnicalServiceStatus, string> = {
      [TechnicalServiceStatus.Open]: 'status-observation',
      [TechnicalServiceStatus.PendingReview]: 'status-insufficient',
      [TechnicalServiceStatus.Closed]: 'status-compliant',
    };

    return classByStatus[status];
  }

  protected resultLabelFor(request: TechnicalServiceRequest): string {
    if (request.functionalTestPassed === null) {
      return 'maintenance.technical-service.table.pending-result';
    }

    return request.functionalTestPassed
      ? 'maintenance.technical-service.table.test-passed'
      : 'maintenance.technical-service.table.test-failed';
  }

  private isOpenRequest(request: TechnicalServiceRequest): boolean {
    return (
      request.status === TechnicalServiceStatus.Open ||
      request.status === TechnicalServiceStatus.PendingReview
    );
  }

  private nextTechnicalServiceRequestId(): number {
    const localMax = Math.max(...this.technicalServiceRequests().map((request) => request.id), 0);
    const storeMax = this.maintenanceStore.nextTechnicalServiceRequestId() - 1;

    return Math.max(localMax, storeMax) + 1;
  }

  private generatedServiceUuid(requestId: number): string {
    return `TS-${requestId.toString().padStart(3, '0')}`;
  }

  private localDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
