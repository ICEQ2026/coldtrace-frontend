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
import { IoTDevice } from '../../../../asset-management/domain/model/iot-device.entity';
import { AssetManagementApi } from '../../../../asset-management/infrastructure/asset-management-api';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { Organization } from '../../../../identity-access/domain/model/organization.entity';
import { Role } from '../../../../identity-access/domain/model/role.entity';
import { User } from '../../../../identity-access/domain/model/user.entity';
import { IdentityAccessApi } from '../../../../identity-access/infrastructure/identity-access-api';
import { MaintenanceManagementStore } from '../../../application/maintenance-management.store';
import { MaintenanceSchedule } from '../../../domain/model/maintenance-schedule.entity';
import { MaintenanceScheduleStatus } from '../../../domain/model/maintenance-schedule-status.enum';
import { MaintenanceManagementApi } from '../../../infrastructure/maintenance-management-api';

type PreventiveMaintenanceFeedback =
  | 'idle'
  | 'scheduled'
  | 'invalid'
  | 'invalid-asset'
  | 'duplicate'
  | 'access-denied'
  | 'server-error';

@Component({
  selector: 'app-preventive-maintenance-scheduler',
  imports: [MatButton, MatIcon, MatProgressSpinner, NgClass, ReactiveFormsModule, TranslatePipe],
  templateUrl: './preventive-maintenance-scheduler.html',
  styleUrl: './preventive-maintenance-scheduler.css',
})
export class PreventiveMaintenanceScheduler implements OnInit {
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
  protected readonly submitted = signal(false);
  protected readonly feedback = signal<PreventiveMaintenanceFeedback>('idle');
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly assets = signal<Asset[]>([]);
  protected readonly iotDevices = signal<IoTDevice[]>([]);
  protected readonly maintenanceSchedules = signal<MaintenanceSchedule[]>([]);

  protected readonly maintenanceForm = this.fb.nonNullable.group({
    assetId: [0, [Validators.required, Validators.min(1)]],
    iotDeviceId: [0],
    scheduledDate: [this.today, [Validators.required]],
    observations: ['', [Validators.required, Validators.minLength(6)]],
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
  protected readonly canScheduleMaintenance = computed(() => {
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
  protected readonly organizationIoTDevices = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.iotDevices().filter((iotDevice) => iotDevice.organizationId === organizationId);
  });
  protected readonly organizationSchedules = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.maintenanceSchedules()
      .filter((schedule) => schedule.organizationId === organizationId)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  });
  protected readonly openSchedules = computed(() => {
    return this.organizationSchedules().filter((schedule) => this.isOpenSchedule(schedule));
  });
  protected readonly trackedAssetsCount = computed(() => {
    return new Set(this.openSchedules().map((schedule) => schedule.assetId)).size;
  });
  protected readonly selectedAssetDevices = computed(() => {
    const selectedAssetId = Number(this.maintenanceForm.controls.assetId.value);

    if (!selectedAssetId) {
      return [];
    }

    return this.organizationIoTDevices().filter((iotDevice) => {
      return iotDevice.assetId === selectedAssetId;
    });
  });

  ngOnInit(): void {
    this.loadPageData();
  }

  protected loadPageData(): void {
    this.identityLoading.set(true);
    this.feedback.set('idle');
    this.maintenanceStore.loadMaintenanceSchedules();

    forkJoin({
      users: this.identityAccessApi.getUsers(),
      roles: this.identityAccessApi.getRoles(),
      organizations: this.identityAccessApi.getOrganizations(),
      assets: this.assetManagementApi.getAssets(),
      iotDevices: this.assetManagementApi.getIoTDevices(),
      maintenanceSchedules: this.maintenanceManagementApi.getMaintenanceSchedules(),
    })
      .pipe(finalize(() => this.identityLoading.set(false)))
      .subscribe({
        next: ({ users, roles, organizations, assets, iotDevices, maintenanceSchedules }) => {
          this.users.set(users);
          this.roles.set(roles);
          this.organizations.set(organizations);
          this.assets.set(assets);
          this.iotDevices.set(iotDevices);
          this.maintenanceSchedules.set(maintenanceSchedules);
          this.identityAccessStore.setCurrentRoleFrom(users, roles);
          this.identityAccessStore.setCurrentOrganizationFrom(users, organizations);
          this.identityAccessStore.initializeRolePermissions(roles);
          this.resetScheduleForm();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected selectAsset(value: string): void {
    this.maintenanceForm.controls.assetId.setValue(Number(value));
    this.maintenanceForm.controls.iotDeviceId.setValue(0);
    this.feedback.set('idle');
    this.submitted.set(false);
  }

  protected schedulePreventiveMaintenance(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.maintenanceForm.markAllAsTouched();

    if (!this.canScheduleMaintenance()) {
      this.feedback.set('access-denied');
      return;
    }

    if (this.maintenanceForm.invalid || this.isPastDate()) {
      this.feedback.set('invalid');
      return;
    }

    const organizationId = this.activeOrganizationId();
    const assetId = Number(this.maintenanceForm.controls.assetId.value);
    const asset = this.assetFor(assetId);
    const period = this.periodFor(this.maintenanceForm.controls.scheduledDate.value);

    if (!organizationId || !asset || asset.status !== AssetStatus.Active) {
      this.feedback.set('invalid-asset');
      return;
    }

    if (this.hasOpenScheduleForAssetPeriod(assetId, period)) {
      this.feedback.set('duplicate');
      return;
    }

    const nextSchedule = new MaintenanceSchedule(
      this.nextScheduleId(),
      organizationId,
      this.generatedScheduleUuid(),
      assetId,
      Number(this.maintenanceForm.controls.iotDeviceId.value) || null,
      this.maintenanceForm.controls.scheduledDate.value,
      period,
      this.maintenanceForm.controls.observations.value.trim(),
      MaintenanceScheduleStatus.Scheduled,
      this.today,
    );

    this.saving.set(true);
    this.maintenanceStore
      .createMaintenanceSchedule(nextSchedule)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (createdSchedule) => {
          this.maintenanceSchedules.update((schedules) => [...schedules, createdSchedule]);
          this.feedback.set('scheduled');
          this.submitted.set(false);
          this.resetScheduleForm();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected resetScheduleForm(): void {
    const firstActiveAsset = this.organizationAssets().find(
      (asset) => asset.status === AssetStatus.Active,
    );

    this.feedback.set('idle');
    this.submitted.set(false);
    this.maintenanceForm.reset({
      assetId: firstActiveAsset?.id ?? 0,
      iotDeviceId: 0,
      scheduledDate: this.today,
      observations: '',
    });
    this.maintenanceForm.markAsPristine();
  }

  protected hasControlError(controlName: keyof typeof this.maintenanceForm.controls): boolean {
    const control = this.maintenanceForm.controls[controlName];

    return control.invalid && (control.touched || this.submitted());
  }

  protected hasDateError(): boolean {
    return this.hasControlError('scheduledDate') || (this.submitted() && this.isPastDate());
  }

  protected assetNameFor(schedule: MaintenanceSchedule): string {
    const asset = this.assetFor(schedule.assetId);

    return asset ? `${asset.uuid} - ${asset.name}` : `#${schedule.assetId}`;
  }

  protected deviceNameFor(schedule: MaintenanceSchedule): string {
    if (!schedule.iotDeviceId) {
      return 'maintenance.preventive.table.asset-level';
    }

    const iotDevice = this.organizationIoTDevices().find(
      (currentDevice) => currentDevice.id === schedule.iotDeviceId,
    );

    return iotDevice ? `${iotDevice.uuid} - ${iotDevice.model}` : `#${schedule.iotDeviceId}`;
  }

  protected assetLocationFor(schedule: MaintenanceSchedule): string {
    return this.assetFor(schedule.assetId)?.location ?? 'N/A';
  }

  protected scheduleStatusKey(status: MaintenanceScheduleStatus): string {
    return `maintenance.preventive.status.${status}`;
  }

  protected scheduleStatusClass(status: MaintenanceScheduleStatus): string {
    const classByStatus: Record<MaintenanceScheduleStatus, string> = {
      [MaintenanceScheduleStatus.Scheduled]: 'status-observation',
      [MaintenanceScheduleStatus.Pending]: 'status-warning',
      [MaintenanceScheduleStatus.Completed]: 'status-compliant',
      [MaintenanceScheduleStatus.Canceled]: 'status-danger',
    };

    return classByStatus[status];
  }

  private assetFor(assetId: number): Asset | undefined {
    return this.organizationAssets().find((asset) => asset.id === assetId);
  }

  private isPastDate(): boolean {
    return this.maintenanceForm.controls.scheduledDate.value < this.today;
  }

  private periodFor(dateValue: string): string {
    return dateValue.slice(0, 7);
  }

  private hasOpenScheduleForAssetPeriod(assetId: number, period: string): boolean {
    return this.organizationSchedules().some((schedule) => {
      return (
        schedule.assetId === assetId && schedule.period === period && this.isOpenSchedule(schedule)
      );
    });
  }

  private isOpenSchedule(schedule: MaintenanceSchedule): boolean {
    return (
      schedule.status === MaintenanceScheduleStatus.Scheduled ||
      schedule.status === MaintenanceScheduleStatus.Pending
    );
  }

  private nextScheduleId(): number {
    const localMax = Math.max(...this.maintenanceSchedules().map((schedule) => schedule.id), 0);
    const storeMax = this.maintenanceStore.nextScheduleId() - 1;

    return Math.max(localMax, storeMax) + 1;
  }

  private generatedScheduleUuid(): string {
    return `PM-${this.nextScheduleId().toString().padStart(3, '0')}`;
  }

  private localDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
