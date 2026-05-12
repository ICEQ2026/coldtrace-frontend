import { NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { AssetManagementStore } from '../../../application/asset-management.store';
import { Asset } from '../../../domain/model/asset.entity';
import { AssetSettings } from '../../../domain/model/asset-settings.entity';
import { AssetStatus } from '../../../domain/model/asset-status.enum';
import { AssetType } from '../../../domain/model/asset-type.enum';
import { CalibrationStatus } from '../../../domain/model/calibration-status.enum';
import { ConnectivityStatus } from '../../../domain/model/connectivity-status.enum';
import { Gateway } from '../../../domain/model/gateway.entity';
import { GatewayStatus } from '../../../domain/model/gateway-status.enum';
import { IoTDevice } from '../../../domain/model/iot-device.entity';
import { IoTDeviceStatus } from '../../../domain/model/iot-device-status.enum';
import {
  IOT_DEVICE_DEFINITIONS,
  IoTDeviceDefinition,
  IoTMeasurementParameter,
} from '../../../domain/model/iot-device-definitions';
import { Organization } from '../../../../identity-access/domain/model/organization.entity';
import { Role } from '../../../../identity-access/domain/model/role.entity';
import { User } from '../../../../identity-access/domain/model/user.entity';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { IdentityAccessApi } from '../../../../identity-access/infrastructure/identity-access-api';

type AssetFeedback =
  | 'idle'
  | 'success'
  | 'updated'
  | 'duplicate-id'
  | 'server-error'
  | 'iot-device-created'
  | 'gateway-created'
  | 'settings-saved';
type AssetManagementTab = AssetType | 'iot-device' | 'gateway' | 'settings';

@Component({
  selector: 'app-cold-room-list',
  imports: [
    MatButton,
    MatIcon,
    MatProgressSpinner,
    FormsModule,
    NgClass,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './cold-room-list.html',
  styleUrl: './cold-room-list.css',
})
export class ColdRoomList implements OnInit {
  protected readonly assetStatus = AssetStatus;
  protected readonly iotDeviceStatus = IoTDeviceStatus;
  protected readonly calibrationStatus = CalibrationStatus;
  protected readonly gatewayStatus = GatewayStatus;
  protected readonly connectivityStatus = ConnectivityStatus;
  protected readonly assetManagementStore = inject(AssetManagementStore);
  protected readonly identityAccessStore = inject(IdentityAccessStore);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly identityAccessApi = inject(IdentityAccessApi);
  private readonly router = inject(Router);

  protected readonly assetTypeTabs: AssetManagementTab[] = [
    AssetType.ColdRoom,
    AssetType.Transport,
    'iot-device',
    'gateway',
    'settings',
  ];
  protected readonly assetStatuses: AssetStatus[] = [
    AssetStatus.Active,
    AssetStatus.Maintenance,
    AssetStatus.Inactive,
  ];
  protected readonly iotDeviceDefinitions: IoTDeviceDefinition[] = IOT_DEVICE_DEFINITIONS;
  protected readonly iotDeviceTypes = this.iotDeviceDefinitions.map(
    (definition) => definition.type,
  );
  protected readonly gatewayStatuses: GatewayStatus[] = [
    GatewayStatus.Active,
    GatewayStatus.Maintenance,
    GatewayStatus.Offline,
  ];
  protected readonly temperatureUnits: string[] = ['°C', '°F'];
  protected readonly weightUnits: string[] = ['kg', 'lb'];
  protected readonly identityLoading = signal(false);
  protected readonly creating = signal(false);
  protected readonly savingSettings = signal(false);
  protected readonly updatingAssetId = signal<number | null>(null);
  protected readonly pendingAssetStatuses = signal<Record<number, AssetStatus>>({});
  protected readonly submitted = signal(false);
  protected readonly formVisible = signal(false);
  protected readonly feedback = signal<AssetFeedback>('idle');
  protected readonly searchTerm = signal('');
  protected readonly selectedTab = signal<AssetManagementTab>(AssetType.ColdRoom);
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly organizations = signal<Organization[]>([]);

  protected readonly coldRoomForm = this.fb.nonNullable.group({
    internalId: ['', [Validators.required, Validators.minLength(3)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    gatewayId: [0, [Validators.required, Validators.min(1)]],
    capacity: [0, [Validators.required, Validators.min(1)]],
    location: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });

  protected readonly iotDeviceForm = this.fb.nonNullable.group({
    internalId: ['', [Validators.required, Validators.minLength(3)]],
    deviceType: ['', [Validators.required]],
    model: ['', [Validators.required, Validators.minLength(3)]],
    measurementType: ['', [Validators.required]],
    assetId: [0],
    nextCalibrationDate: [''],
  });

  protected readonly gatewayForm = this.fb.nonNullable.group({
    internalId: ['', [Validators.required, Validators.minLength(3)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    location: ['', [Validators.required, Validators.minLength(3)]],
    network: ['', [Validators.required, Validators.minLength(2)]],
    status: [GatewayStatus.Active, [Validators.required]],
  });

  protected readonly settingsForm = this.fb.nonNullable.group({
    assetTypes: ['', [Validators.required, Validators.minLength(3)]],
    iotDeviceTypes: ['', [Validators.required, Validators.minLength(3)]],
    minimumTemperature: [-5, [Validators.required]],
    maximumTemperature: [8, [Validators.required]],
    maximumHumidity: [85, [Validators.required, Validators.min(1), Validators.max(100)]],
    calibrationFrequencyDays: [180, [Validators.required, Validators.min(1)]],
    temperatureUnit: ['°C', [Validators.required]],
    humidityUnit: ['%', [Validators.required]],
    weightUnit: ['kg', [Validators.required]],
  });

  protected readonly loading = computed(
    () => this.identityLoading() || this.assetManagementStore.loading(),
  );
  protected readonly assets = this.assetManagementStore.assets;
  protected readonly iotDevices = this.assetManagementStore.iotDevices;
  protected readonly gateways = this.assetManagementStore.gateways;
  protected readonly assetSettings = this.assetManagementStore.assetSettings;
  protected readonly activeOrganizationName = computed(() => {
    return this.identityAccessStore.currentOrganizationNameFrom(this.users(), this.organizations());
  });
  protected readonly profileUserName = computed(() =>
    this.identityAccessStore.currentUserNameFrom(this.users()),
  );
  protected readonly profileRoleLabelKey = computed(() =>
    this.identityAccessStore.currentRoleLabelKeyFrom(this.users(), this.roles()),
  );
  protected readonly canManageAccess = computed(() =>
    this.identityAccessStore.canManageAccess(this.users(), this.roles()),
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
  protected readonly canCreateSelectedResource = computed(() => {
    return (
      this.isAssetTab() || this.selectedTab() === 'iot-device' || this.selectedTab() === 'gateway'
    );
  });
  protected readonly positiveFeedback = computed(() => {
    return [
      'success',
      'updated',
      'iot-device-created',
      'gateway-created',
      'settings-saved',
    ].includes(this.feedback());
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

  protected readonly assetIssueCount = computed(() => {
    return this.assetManagementStore.assetIssueCountFor(this.activeOrganizationId());
  });

  protected readonly organizationIoTDevices = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.iotDevices().filter((iotDevice) => iotDevice.organizationId === organizationId);
  });

  protected readonly organizationGateways = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return [];
    }

    return this.gateways().filter((gateway) => gateway.organizationId === organizationId);
  });

  protected readonly activeAssetSettings = computed(() => {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return null;
    }

    return this.assetManagementStore.defaultSettingsForOrganization(organizationId) ?? null;
  });

  protected readonly calibrationSummary = computed(() => {
    return [
      {
        status: CalibrationStatus.Compliant,
        count: this.calibrationCount(CalibrationStatus.Compliant),
      },
      {
        status: CalibrationStatus.DueSoon,
        count: this.calibrationCount(CalibrationStatus.DueSoon),
      },
      {
        status: CalibrationStatus.Expired,
        count: this.calibrationCount(CalibrationStatus.Expired),
      },
      {
        status: CalibrationStatus.Unknown,
        count: this.calibrationCount(CalibrationStatus.Unknown),
      },
    ];
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
        this.gatewayNameForAsset(asset),
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
    this.assetManagementStore.loadIoTDevices();
    this.assetManagementStore.loadGateways();
    this.assetManagementStore.loadAssetSettings();

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
    this.resetForms();

    if (tab === 'settings') {
      this.resetSettingsForm();
    }
  }

  protected toggleForm(): void {
    this.feedback.set('idle');
    this.submitted.set(false);
    const willOpen = !this.formVisible();
    this.formVisible.set(willOpen);
    this.resetForms();
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

    const gatewayId = Number(this.coldRoomForm.controls.gatewayId.value);
    const gateway = this.organizationGateways().find(
      (currentGateway) => currentGateway.id === gatewayId,
    );

    if (!gateway) {
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
      gateway.id,
      this.coldRoomForm.controls.name.value.trim(),
      this.coldRoomForm.controls.location.value.trim(),
      Number(this.coldRoomForm.controls.capacity.value),
      this.coldRoomForm.controls.description.value.trim(),
      AssetStatus.Active,
      'none',
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

  protected submitIoTDevice(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.iotDeviceForm.markAllAsTouched();

    if (this.iotDeviceForm.invalid || !this.canManageAssets()) {
      return;
    }

    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      this.feedback.set('server-error');
      return;
    }

    const internalId = this.iotDeviceForm.controls.internalId.value.trim().toUpperCase();
    const duplicatedInternalId = this.organizationIoTDevices().some((iotDevice) => {
      return iotDevice.uuid.toLowerCase() === internalId.toLowerCase();
    });

    if (duplicatedInternalId) {
      this.feedback.set('duplicate-id');
      return;
    }

    const assetId = Number(this.iotDeviceForm.controls.assetId.value) || null;
    const nextCalibrationDate = this.iotDeviceForm.controls.nextCalibrationDate.value.trim();
    const measurementParameters = this.measurementParametersForDeviceType(
      this.iotDeviceForm.controls.deviceType.value,
    );
    const iotDevice = new IoTDevice(
      Math.max(...this.iotDevices().map((currentIoTDevice) => currentIoTDevice.id), 0) + 1,
      organizationId,
      internalId,
      this.iotDeviceForm.controls.deviceType.value,
      this.iotDeviceForm.controls.model.value.trim(),
      this.measurementTypeLabel(measurementParameters),
      assetId,
      assetId ? IoTDeviceStatus.Linked : IoTDeviceStatus.Available,
      CalibrationStatus.Unknown,
      '—',
      nextCalibrationDate || '—',
      measurementParameters,
    );

    this.creating.set(true);
    this.assetManagementStore
      .createIoTDevice(iotDevice)
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: () => {
          this.feedback.set('iot-device-created');
          this.submitted.set(false);
          this.formVisible.set(false);
          this.resetIoTDeviceForm();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected submitGateway(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.gatewayForm.markAllAsTouched();

    if (this.gatewayForm.invalid || !this.canManageAssets()) {
      return;
    }

    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      this.feedback.set('server-error');
      return;
    }

    const internalId = this.gatewayForm.controls.internalId.value.trim().toUpperCase();
    const duplicatedInternalId = this.organizationGateways().some((gateway) => {
      return gateway.uuid.toLowerCase() === internalId.toLowerCase();
    });

    if (duplicatedInternalId) {
      this.feedback.set('duplicate-id');
      return;
    }

    const gateway = new Gateway(
      Math.max(...this.gateways().map((currentGateway) => currentGateway.id), 0) + 1,
      organizationId,
      internalId,
      this.gatewayForm.controls.name.value.trim(),
      this.gatewayForm.controls.location.value.trim(),
      this.gatewayForm.controls.network.value.trim(),
      this.gatewayForm.controls.status.value,
    );

    this.creating.set(true);
    this.assetManagementStore
      .createGateway(gateway)
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: () => {
          this.feedback.set('gateway-created');
          this.submitted.set(false);
          this.formVisible.set(false);
          this.resetGatewayForm();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected saveSettings(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.settingsForm.markAllAsTouched();

    if (this.settingsForm.invalid || !this.canManageAssets()) {
      return;
    }

    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      this.feedback.set('server-error');
      return;
    }

    const currentSettings = this.activeAssetSettings() ?? this.defaultAssetSettings(organizationId);
    const assetTypes = this.toList(this.settingsForm.controls.assetTypes.value);
    const iotDeviceTypes = this.toList(this.settingsForm.controls.iotDeviceTypes.value);

    if (!assetTypes.length || !iotDeviceTypes.length) {
      this.settingsForm.controls.assetTypes.setErrors(
        assetTypes.length ? null : { required: true },
      );
      this.settingsForm.controls.iotDeviceTypes.setErrors(
        iotDeviceTypes.length ? null : { required: true },
      );
      return;
    }

    const minimumTemperature = Number(this.settingsForm.controls.minimumTemperature.value);
    const maximumTemperature = Number(this.settingsForm.controls.maximumTemperature.value);

    if (minimumTemperature >= maximumTemperature) {
      this.settingsForm.controls.maximumTemperature.setErrors({ range: true });
      return;
    }

    const nextSettings = new AssetSettings(
      currentSettings.id,
      organizationId,
      currentSettings.uuid,
      assetTypes,
      iotDeviceTypes,
      minimumTemperature,
      maximumTemperature,
      Number(this.settingsForm.controls.maximumHumidity.value),
      Number(this.settingsForm.controls.calibrationFrequencyDays.value),
      this.settingsForm.controls.temperatureUnit.value,
      this.settingsForm.controls.humidityUnit.value,
      this.settingsForm.controls.weightUnit.value,
    );
    const request = this.activeAssetSettings()
      ? this.assetManagementStore.updateAssetSettings(nextSettings)
      : this.assetManagementStore.createAssetSettings(nextSettings);

    this.savingSettings.set(true);
    request.pipe(finalize(() => this.savingSettings.set(false))).subscribe({
      next: () => {
        this.feedback.set('settings-saved');
        this.submitted.set(false);
        this.settingsForm.markAsPristine();
      },
      error: () => this.feedback.set('server-error'),
    });
  }

  protected updateAssetStatus(asset: Asset, value: string): void {
    this.feedback.set('idle');

    const nextStatus = this.assetStatuses.find((status) => status === value);

    if (!nextStatus || nextStatus === asset.status || !this.canManageAssets()) {
      this.clearPendingAssetStatus(asset.id);
      return;
    }

    this.pendingAssetStatuses.update((statuses) => ({ ...statuses, [asset.id]: nextStatus }));
    this.updatingAssetId.set(asset.id);
    this.assetManagementStore
      .updateAsset(this.nextAsset(asset, { status: nextStatus }))
      .pipe(
        finalize(() => {
          this.updatingAssetId.set(null);
          this.clearPendingAssetStatus(asset.id);
        }),
      )
      .subscribe({
        next: () => {
          this.feedback.set('updated');
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected assetNameForIoTDevice(iotDevice: IoTDevice): string {
    const asset = this.assets().find((currentAsset) => currentAsset.id === iotDevice.assetId);
    return asset ? `${asset.uuid} - ${asset.name}` : 'asset-management.iot-devices.unassigned';
  }

  protected displayedAssetStatus(asset: Asset): AssetStatus {
    return this.pendingAssetStatuses()[asset.id] ?? asset.status;
  }

  protected gatewayNameForAsset(asset: Asset): string {
    return this.gatewayNameById(asset.gatewayId);
  }

  protected gatewayNameForIoTDevice(iotDevice: IoTDevice): string {
    const asset = this.assets().find((currentAsset) => currentAsset.id === iotDevice.assetId);
    return asset
      ? this.gatewayNameById(asset.gatewayId)
      : 'asset-management.iot-devices.unassigned';
  }

  protected gatewayAssetCount(gateway: Gateway): number {
    return this.organizationAssets().filter((asset) => asset.gatewayId === gateway.id).length;
  }

  protected gatewayDeviceCount(gateway: Gateway): number {
    const assetIds = this.organizationAssets()
      .filter((asset) => asset.gatewayId === gateway.id)
      .map((asset) => asset.id);

    return this.organizationIoTDevices().filter((iotDevice) => {
      return !!iotDevice.assetId && assetIds.includes(iotDevice.assetId);
    }).length;
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

  protected createButtonKey(): string {
    if (this.formVisible()) {
      return 'asset-management.form.close';
    }

    if (this.selectedTab() === 'iot-device') {
      return 'asset-management.iot-devices.form-open';
    }

    if (this.selectedTab() === 'gateway') {
      return 'asset-management.gateways.form-open';
    }

    return this.formOpenKey();
  }

  protected formCreatedKey(): string {
    if (this.feedback() === 'updated') {
      return 'asset-management.update.feedback-updated';
    }

    if (this.feedback() === 'iot-device-created') {
      return 'asset-management.iot-devices.feedback-created';
    }

    if (this.feedback() === 'gateway-created') {
      return 'asset-management.gateways.feedback-created';
    }

    if (this.feedback() === 'settings-saved') {
      return 'asset-management.settings.feedback-saved';
    }

    return `asset-management.sections.${this.selectedAssetType()}.feedback-created`;
  }

  protected formDuplicateKey(): string {
    if (this.selectedTab() === 'iot-device') {
      return 'asset-management.iot-devices.feedback-duplicate';
    }

    if (this.selectedTab() === 'gateway') {
      return 'asset-management.gateways.feedback-duplicate';
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

  protected assetStatusLabel(status: AssetStatus): string {
    return this.translate.instant(this.statusLabelKey(status));
  }

  protected connectivityLabelKey(connectivity: ConnectivityStatus): string {
    return `asset-management.connectivity.${connectivity}`;
  }

  protected calibrationLabelKey(status: CalibrationStatus): string {
    return `asset-management.iot-devices.calibration-status.${status}`;
  }

  protected deviceTypeLabelKey(deviceType: string): string {
    return `asset-management.iot-devices.device-types.${deviceType}`;
  }

  protected selectIoTDeviceType(deviceType: string): void {
    const parameters = this.measurementParametersForDeviceType(deviceType);
    this.iotDeviceForm.controls.measurementType.setValue(this.measurementTypeLabel(parameters));

    if (!this.iotDeviceForm.controls.model.value.trim()) {
      this.iotDeviceForm.controls.model.setValue(
        this.iotDeviceDefinitions.find((definition) => definition.type === deviceType)
          ?.modelPlaceholder ?? '',
      );
    }
  }

  protected measurementParameterLabelKey(parameter: string): string {
    return `asset-management.iot-devices.measurement-parameters.${parameter}`;
  }

  protected measurementParametersFor(iotDevice: IoTDevice): string[] {
    return iotDevice.measurementParameters.length
      ? iotDevice.measurementParameters
      : this.measurementParametersForDeviceType(iotDevice.deviceType);
  }

  protected selectedIoTDeviceParameters(): string[] {
    return this.measurementParametersForDeviceType(this.iotDeviceForm.controls.deviceType.value);
  }

  protected gatewayStatusLabelKey(status: GatewayStatus): string {
    return `asset-management.gateways.status.${status}`;
  }

  protected assetStatusToneClass(status: AssetStatus): string {
    const classByStatus: Record<AssetStatus, string> = {
      [AssetStatus.Active]: 'tone-success',
      [AssetStatus.Maintenance]: 'tone-warning',
      [AssetStatus.Inactive]: 'tone-danger',
    };

    return classByStatus[status];
  }

  protected iotDeviceStatusToneClass(status: IoTDeviceStatus): string {
    const classByStatus: Record<IoTDeviceStatus, string> = {
      [IoTDeviceStatus.Linked]: 'tone-success',
      [IoTDeviceStatus.Available]: 'tone-neutral',
      [IoTDeviceStatus.Offline]: 'tone-danger',
    };

    return classByStatus[status];
  }

  protected calibrationToneClass(status: CalibrationStatus): string {
    const classByStatus: Record<CalibrationStatus, string> = {
      [CalibrationStatus.Compliant]: 'tone-success',
      [CalibrationStatus.DueSoon]: 'tone-warning',
      [CalibrationStatus.Expired]: 'tone-danger',
      [CalibrationStatus.Unknown]: 'tone-neutral',
    };

    return classByStatus[status];
  }

  protected gatewayStatusToneClass(status: GatewayStatus): string {
    const classByStatus: Record<GatewayStatus, string> = {
      [GatewayStatus.Active]: 'tone-success',
      [GatewayStatus.Maintenance]: 'tone-warning',
      [GatewayStatus.Offline]: 'tone-danger',
    };

    return classByStatus[status];
  }

  protected settingsAssetTypeList(): string[] {
    return this.toList(this.settingsForm.controls.assetTypes.value);
  }

  protected settingsIoTDeviceTypeList(): string[] {
    return this.toList(this.settingsForm.controls.iotDeviceTypes.value);
  }

  protected temperatureRangeLabel(): string {
    return `${this.settingsForm.controls.minimumTemperature.value}${this.settingsForm.controls.temperatureUnit.value} - ${this.settingsForm.controls.maximumTemperature.value}${this.settingsForm.controls.temperatureUnit.value}`;
  }

  protected humidityLimitLabel(): string {
    return `${this.settingsForm.controls.maximumHumidity.value}${this.settingsForm.controls.humidityUnit.value}`;
  }

  protected calibrationFrequencyLabel(): string {
    return `${this.settingsForm.controls.calibrationFrequencyDays.value}`;
  }

  protected incidentLabelKey(lastIncident: string): string {
    return `asset-management.incidents.${this.normalizeIncident(lastIncident)}`;
  }

  protected incidentIconName(lastIncident: string): string {
    const iconByIncident: Record<string, string> = {
      'high-temperature': 'warning',
      'connection-lost': 'report',
      'high-humidity': 'warning_amber',
      'low-temperature': 'change_history',
      none: 'check_circle',
    };

    return iconByIncident[this.normalizeIncident(lastIncident)] ?? 'info';
  }

  protected incidentSeverityClass(lastIncident: string): string {
    const classByIncident: Record<string, string> = {
      'high-temperature': 'danger',
      'connection-lost': 'danger',
      'high-humidity': 'warning',
      'low-temperature': 'cold',
      none: 'stable',
    };

    return classByIncident[this.normalizeIncident(lastIncident)] ?? 'stable';
  }

  private normalizeIncident(lastIncident: string): string {
    const prefix = 'asset-management.incidents.';
    return lastIncident.startsWith(prefix) ? lastIncident.slice(prefix.length) : lastIncident;
  }

  protected hasControlError(controlName: keyof typeof this.coldRoomForm.controls): boolean {
    const control = this.coldRoomForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected hasIoTDeviceControlError(
    controlName: keyof typeof this.iotDeviceForm.controls,
  ): boolean {
    const control = this.iotDeviceForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected hasGatewayControlError(controlName: keyof typeof this.gatewayForm.controls): boolean {
    const control = this.gatewayForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected hasSettingsControlError(controlName: keyof typeof this.settingsForm.controls): boolean {
    const control = this.settingsForm.controls[controlName];
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

  private calibrationCount(status: CalibrationStatus): number {
    return this.organizationIoTDevices().filter((iotDevice) => {
      return iotDevice.calibrationStatus === status;
    }).length;
  }

  private resetForms(): void {
    this.resetForm();
    this.resetIoTDeviceForm();
    this.resetGatewayForm();
  }

  private resetForm(): void {
    this.coldRoomForm.reset({
      internalId: this.generatedAssetUuid(this.selectedAssetType()),
      name: '',
      gatewayId: 0,
      capacity: 0,
      location: '',
      description: '',
    });
  }

  private resetIoTDeviceForm(): void {
    this.iotDeviceForm.reset({
      internalId: this.generatedIoTDeviceUuid(),
      deviceType: '',
      model: '',
      measurementType: '',
      assetId: 0,
      nextCalibrationDate: '',
    });
  }

  private resetGatewayForm(): void {
    this.gatewayForm.reset({
      internalId: this.generatedGatewayUuid(),
      name: '',
      location: '',
      network: '',
      status: GatewayStatus.Active,
    });
  }

  protected resetSettingsForm(): void {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return;
    }

    const settings = this.activeAssetSettings() ?? this.defaultAssetSettings(organizationId);
    this.settingsForm.reset({
      assetTypes: settings.assetTypes.join('\n'),
      iotDeviceTypes: settings.iotDeviceTypes.join('\n'),
      minimumTemperature: settings.minimumTemperature,
      maximumTemperature: settings.maximumTemperature,
      maximumHumidity: settings.maximumHumidity,
      calibrationFrequencyDays: settings.calibrationFrequencyDays,
      temperatureUnit: settings.temperatureUnit,
      humidityUnit: settings.humidityUnit,
      weightUnit: settings.weightUnit,
    });
    this.settingsForm.markAsPristine();
  }

  private defaultAssetSettings(organizationId: number): AssetSettings {
    const nextId = Math.max(...this.assetSettings().map((settings) => settings.id), 0) + 1;

    return new AssetSettings(
      nextId,
      organizationId,
      `CFG-${organizationId.toString().padStart(3, '0')}`,
      ['Cold room', 'Refrigerated transport'],
      ['Temperature sensor', 'Humidity sensor', 'Motion sensor', 'Camera', 'Multi-sensor'],
      -5,
      8,
      85,
      180,
      '°C',
      '%',
      'kg',
    );
  }

  private toList(value: string): string[] {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private measurementParametersForDeviceType(deviceType: string): IoTMeasurementParameter[] {
    return (
      this.iotDeviceDefinitions.find((definition) => definition.type === deviceType)?.parameters ??
      []
    );
  }

  private measurementTypeLabel(parameters: string[]): string {
    return parameters
      .map((parameter) => this.translate.instant(this.measurementParameterLabelKey(parameter)))
      .join(' / ');
  }

  private nextAsset(
    asset: Asset,
    fields: Partial<{
      status: AssetStatus;
      lastIncident: string;
      currentTemperature: string;
      connectivity: ConnectivityStatus;
    }>,
  ): Asset {
    return new Asset(
      asset.id,
      asset.organizationId,
      asset.uuid,
      asset.type,
      asset.gatewayId,
      asset.name,
      asset.location,
      asset.capacity,
      asset.description,
      fields.status ?? asset.status,
      fields.lastIncident ?? asset.lastIncident,
      fields.currentTemperature ?? asset.currentTemperature,
      asset.entryDate,
      fields.connectivity ?? asset.connectivity,
    );
  }

  private clearPendingAssetStatus(assetId: number): void {
    this.pendingAssetStatuses.update((statuses) => {
      const nextStatuses = { ...statuses };
      delete nextStatuses[assetId];
      return nextStatuses;
    });
  }

  private gatewayNameById(gatewayId: number | null): string {
    const gateway = this.gateways().find((currentGateway) => currentGateway.id === gatewayId);
    return gateway
      ? `${gateway.uuid} - ${gateway.location}`
      : 'asset-management.gateways.unassigned';
  }

  private generatedAssetUuid(assetType: AssetType): string {
    const organizationId = this.activeOrganizationId();
    const currentUuids = this.assets()
      .filter(
        (asset) =>
          (!organizationId || asset.organizationId === organizationId) && asset.type === assetType,
      )
      .map((asset) => asset.uuid);

    if (assetType === AssetType.Transport) {
      return this.generatedUuid('TR', currentUuids, 10000 + currentUuids.length + 1, 5);
    }

    return this.generatedUuid('CR', currentUuids, currentUuids.length + 1, 5);
  }

  private generatedIoTDeviceUuid(): string {
    const organizationId = this.activeOrganizationId();
    const currentUuids = this.iotDevices()
      .filter((iotDevice) => !organizationId || iotDevice.organizationId === organizationId)
      .map((iotDevice) => iotDevice.uuid);

    return this.generatedUuid('SN', currentUuids, currentUuids.length + 1, 3);
  }

  private generatedGatewayUuid(): string {
    const organizationId = this.activeOrganizationId();
    const currentUuids = this.gateways()
      .filter((gateway) => !organizationId || gateway.organizationId === organizationId)
      .map((gateway) => gateway.uuid);

    return this.generatedUuid('GW', currentUuids, currentUuids.length + 1, 3);
  }

  private generatedUuid(
    prefix: string,
    currentUuids: string[],
    firstNumber: number,
    width: number,
  ): string {
    const normalizedUuids = new Set(currentUuids.map((uuid) => uuid.toLowerCase()));
    let nextNumber = firstNumber;
    let candidate = '';

    do {
      candidate = `${prefix}-${nextNumber.toString().padStart(width, '0')}`;
      nextNumber += 1;
    } while (normalizedUuids.has(candidate.toLowerCase()));

    return candidate;
  }
}
