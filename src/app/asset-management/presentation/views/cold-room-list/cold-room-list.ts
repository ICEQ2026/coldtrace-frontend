import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { AssetManagementStore } from '../../../application/asset-management.store';
import { Asset } from '../../../domain/model/asset.entity';
import { AssetStatus } from '../../../domain/model/asset-status.enum';
import { AssetType } from '../../../domain/model/asset-type.enum';
import { ConnectivityStatus } from '../../../domain/model/connectivity-status.enum';
import { Sensor } from '../../../domain/model/sensor.entity';
import { SensorStatus } from '../../../domain/model/sensor-status.enum';
import { Organization } from '../../../../identity-access/domain/model/organization.entity';
import { Role } from '../../../../identity-access/domain/model/role.entity';
import { User } from '../../../../identity-access/domain/model/user.entity';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { IdentityAccessApi } from '../../../../identity-access/infrastructure/identity-access-api';
import { DashboardShell } from '../../../../shared/presentation/componentes/dashboard-shell/dashboard-shell';

type AssetFeedback = 'idle' | 'success' | 'duplicate-id' | 'server-error';
type AssetManagementTab = AssetType | 'sensor' | 'gateway' | 'settings';

@Component({
  selector: 'app-cold-room-list',
  imports: [DashboardShell, MatIcon, MatProgressSpinner, ReactiveFormsModule, TranslatePipe],
  templateUrl: './cold-room-list.html',
  styleUrl: './cold-room-list.css',
})
export class ColdRoomList implements OnInit {
  protected readonly assetStatus = AssetStatus;
  protected readonly sensorStatus = SensorStatus;
  protected readonly connectivityStatus = ConnectivityStatus;
  protected readonly assetManagementStore = inject(AssetManagementStore);
  protected readonly identityAccessStore = inject(IdentityAccessStore);
  private readonly fb = inject(FormBuilder);
  private readonly identityAccessApi = inject(IdentityAccessApi);
  private readonly router = inject(Router);

  protected readonly assetTypeTabs: AssetManagementTab[] = [
    AssetType.ColdRoom,
    AssetType.Transport,
    'sensor',
    'gateway',
    'settings',
  ];
  protected readonly identityLoading = signal(false);
  protected readonly creating = signal(false);
  protected readonly submitted = signal(false);
  protected readonly formVisible = signal(false);
  protected readonly feedback = signal<AssetFeedback>('idle');
  protected readonly searchTerm = signal('');
  protected readonly selectedTab = signal<AssetManagementTab>(AssetType.ColdRoom);
  protected readonly selectedSensorId = signal<number | null>(null);
  protected readonly selectedAssetId = signal<number | null>(null);
  protected readonly linkingSensor = signal(false);
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly organizations = signal<Organization[]>([]);

  protected readonly coldRoomForm = this.fb.nonNullable.group({
    internalId: ['', [Validators.required, Validators.minLength(3)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    capacity: [0, [Validators.required, Validators.min(1)]],
    location: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });

  protected readonly loading = computed(
    () => this.identityLoading() || this.assetManagementStore.loading(),
  );
  protected readonly assets = this.assetManagementStore.assets;
  protected readonly sensors = this.assetManagementStore.sensors;
  protected readonly activeOrganizationName = computed(() => {
    return this.identityAccessStore.currentOrganizationNameFrom(this.users(), this.organizations());
  });
  protected readonly profileUserName = computed(() => this.identityAccessStore.currentUserNameFrom(this.users()));
  protected readonly profileRoleLabelKey = computed(
    () => this.identityAccessStore.currentRoleLabelKeyFrom(this.users(), this.roles()),
  );
  protected readonly canManageAccess = computed(
    () => this.identityAccessStore.canManageAccess(this.users(), this.roles()),
  );
  protected readonly canManageAssets = computed(() => {
    const role = this.identityAccessStore.currentRoleFrom(this.users(), this.roles());
    return this.identityAccessStore
      .permissionKeysForRole(role)
      .includes('roles-permissions.permissions.manage-assets');
  });
  protected readonly selectedAssetType = computed(() => {
    return this.selectedTab() === AssetType.Transport ? AssetType.Transport : AssetType.ColdRoom;
  });
  protected readonly isAssetTab = computed(() => {
    return this.selectedTab() === AssetType.ColdRoom || this.selectedTab() === AssetType.Transport;
  });

  protected readonly selectedAssets = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.assets().filter((asset) => {
      return asset.organizationId === organizationId && asset.type === this.selectedAssetType();
    });
  });

  protected readonly organizationAssets = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.assets().filter((asset) => asset.organizationId === organizationId);
  });

  protected readonly organizationSensors = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.sensors().filter((sensor) => sensor.organizationId === organizationId);
  });

  protected readonly availableSensors = computed(() => {
    return this.organizationSensors().filter((sensor) => !sensor.assetId);
  });

  protected readonly filteredAssets = computed(() => {
    const normalizedSearch = this.searchTerm().trim().toLowerCase();

    if (!normalizedSearch) {
      return this.selectedAssets();
    }

    return this.selectedAssets().filter((asset) => {
      return [
        asset.uuid,
        asset.name,
        asset.location,
        asset.status,
        asset.connectivity,
        asset.lastIncident,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  });

  ngOnInit(): void {
    this.loadPageData();
  }

  protected loadPageData(): void {
    this.identityLoading.set(true);
    this.feedback.set('idle');
    this.assetManagementStore.loadAssets();
    this.assetManagementStore.loadSensors();

    forkJoin({
      users: this.identityAccessApi.getUsers(),
      roles: this.identityAccessApi.getRoles(),
      organizations: this.identityAccessApi.getOrganizations(),
    })
      .pipe(finalize(() => this.identityLoading.set(false)))
      .subscribe({
        next: ({ users, roles, organizations }) => {
          this.users.set(users);
          this.roles.set(roles);
          this.organizations.set(organizations);
          this.identityAccessStore.setCurrentRoleFrom(users, roles);
          this.identityAccessStore.setCurrentOrganizationFrom(users, organizations);
          this.identityAccessStore.initializeRolePermissions(roles);
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected selectAssetType(tab: AssetManagementTab): void {
    if (this.selectedTab() === tab) {
      return;
    }

    this.selectedTab.set(tab);
    this.searchTerm.set('');
    this.formVisible.set(false);
    this.feedback.set('idle');
    this.submitted.set(false);
    this.selectedSensorId.set(null);
    this.selectedAssetId.set(null);
    this.resetForm();
  }

  protected toggleForm(): void {
    this.feedback.set('idle');
    this.formVisible.update((visible) => !visible);
  }

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.coldRoomForm.markAllAsTouched();

    if (this.coldRoomForm.invalid || !this.canManageAssets()) {
      return;
    }

    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      this.feedback.set('server-error');
      return;
    }

    const internalId = this.coldRoomForm.controls.internalId.value.trim().toUpperCase();
    const duplicatedInternalId = this.selectedAssets().some(
      (asset) => asset.uuid.toLowerCase() === internalId.toLowerCase(),
    );

    if (duplicatedInternalId) {
      this.feedback.set('duplicate-id');
      return;
    }

    const nextId = Math.max(...this.assets().map((asset) => asset.id), 0) + 1;
    const asset = new Asset(
      nextId,
      organizationId,
      internalId,
      this.selectedAssetType(),
      this.coldRoomForm.controls.name.value.trim(),
      this.coldRoomForm.controls.location.value.trim(),
      Number(this.coldRoomForm.controls.capacity.value),
      this.coldRoomForm.controls.description.value.trim(),
      AssetStatus.Active,
      'asset-management.incidents.none',
      '—',
      this.entryDate(),
      ConnectivityStatus.Online,
    );

    this.creating.set(true);
    this.assetManagementStore
      .createAsset(asset)
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: () => {
          this.feedback.set('success');
          this.submitted.set(false);
          this.formVisible.set(false);
          this.resetForm();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected linkSensor(): void {
    this.feedback.set('idle');

    const sensor = this.organizationSensors().find((currentSensor) => {
      return currentSensor.id === this.selectedSensorId();
    });
    const asset = this.organizationAssets().find((currentAsset) => {
      return currentAsset.id === this.selectedAssetId();
    });

    if (!sensor || !asset || sensor.assetId) {
      this.feedback.set('duplicate-id');
      return;
    }

    const updatedSensor = new Sensor(
      sensor.id,
      sensor.organizationId,
      sensor.uuid,
      sensor.model,
      sensor.measurementType,
      asset.id,
      sensor.gatewayId,
      SensorStatus.Linked,
      sensor.calibrationStatus,
      sensor.lastCalibrationDate,
      sensor.nextCalibrationDate,
    );

    this.linkingSensor.set(true);
    this.assetManagementStore
      .updateSensor(updatedSensor)
      .pipe(finalize(() => this.linkingSensor.set(false)))
      .subscribe({
        next: () => {
          this.feedback.set('success');
          this.selectedSensorId.set(null);
          this.selectedAssetId.set(null);
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected assetNameForSensor(sensor: Sensor): string {
    const asset = this.assets().find((currentAsset) => currentAsset.id === sensor.assetId);
    return asset ? `${asset.uuid} - ${asset.name}` : 'asset-management.sensors.unassigned';
  }

  protected updateSelectedSensor(value: string): void {
    this.selectedSensorId.set(Number(value) || null);
  }

  protected updateSelectedAsset(value: string): void {
    this.selectedAssetId.set(Number(value) || null);
  }

  protected assetTypeLabelKey(assetType: AssetManagementTab): string {
    return `asset-management.tabs.${assetType}`;
  }

  protected pageTitleKey(): string {
    return `asset-management.sections.${this.selectedAssetType()}.title`;
  }

  protected pageSubtitleKey(): string {
    return `asset-management.sections.${this.selectedAssetType()}.subtitle`;
  }

  protected formTitleKey(): string {
    return `asset-management.sections.${this.selectedAssetType()}.form-title`;
  }

  protected formSubtitleKey(): string {
    return `asset-management.sections.${this.selectedAssetType()}.form-subtitle`;
  }

  protected formOpenKey(): string {
    return `asset-management.sections.${this.selectedAssetType()}.form-open`;
  }

  protected formCreateKey(): string {
    return `asset-management.sections.${this.selectedAssetType()}.form-create`;
  }

  protected formCreatedKey(): string {
    if (this.selectedTab() === 'sensor') {
      return 'asset-management.sensors.feedback-linked';
    }

    return `asset-management.sections.${this.selectedAssetType()}.feedback-created`;
  }

  protected formDuplicateKey(): string {
    if (this.selectedTab() === 'sensor') {
      return 'asset-management.sensors.feedback-unavailable';
    }

    return `asset-management.sections.${this.selectedAssetType()}.feedback-duplicate`;
  }

  protected internalIdPlaceholder(): string {
    return this.selectedAssetType() === AssetType.Transport ? 'TR-10001' : 'CR-42312';
  }

  protected namePlaceholderKey(): string {
    return `asset-management.sections.${this.selectedAssetType()}.name-placeholder`;
  }

  protected statusLabelKey(status: AssetStatus): string {
    return `asset-management.status.${status}`;
  }

  protected connectivityLabelKey(connectivity: ConnectivityStatus): string {
    return `asset-management.connectivity.${connectivity}`;
  }

  protected incidentIconName(lastIncident: string): string {
    const iconByIncidentKey: Record<string, string> = {
      'asset-management.incidents.high-temperature': 'warning',
      'asset-management.incidents.connection-lost': 'report',
      'asset-management.incidents.high-humidity': 'warning_amber',
      'asset-management.incidents.low-temperature': 'change_history',
      'asset-management.incidents.none': 'check_circle',
    };

    return iconByIncidentKey[lastIncident] ?? 'info';
  }

  protected incidentSeverityClass(lastIncident: string): string {
    const classByIncidentKey: Record<string, string> = {
      'asset-management.incidents.high-temperature': 'danger',
      'asset-management.incidents.connection-lost': 'danger',
      'asset-management.incidents.high-humidity': 'warning',
      'asset-management.incidents.low-temperature': 'cold',
      'asset-management.incidents.none': 'stable',
    };

    return classByIncidentKey[lastIncident] ?? 'stable';
  }

  protected hasControlError(controlName: keyof typeof this.coldRoomForm.controls): boolean {
    const control = this.coldRoomForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected logout(): void {
    this.identityAccessStore.clearCurrentUser();
    void this.router.navigate(['/identity-access/sign-in']);
  }

  private activeOrganizationId(): number | null {
    return this.identityAccessStore.currentOrganizationIdFrom(this.users());
  }

  private entryDate(): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }

  private resetForm(): void {
    this.coldRoomForm.reset({
      internalId: '',
      name: '',
      capacity: 0,
      location: '',
      description: '',
    });
  }
}
