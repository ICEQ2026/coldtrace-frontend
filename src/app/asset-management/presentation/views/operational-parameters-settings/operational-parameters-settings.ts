import { NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { IdentityAccessStore } from '../../../../identity-access/application/identity-access.store';
import { Organization } from '../../../../identity-access/domain/model/organization.entity';
import { Role } from '../../../../identity-access/domain/model/role.entity';
import { User } from '../../../../identity-access/domain/model/user.entity';
import { IdentityAccessApi } from '../../../../identity-access/infrastructure/identity-access-api';
import { AssetManagementStore } from '../../../application/asset-management.store';
import { AssetStatus } from '../../../domain/model/asset-status.enum';
import { Asset } from '../../../domain/model/asset.entity';
import { GatewayStatus } from '../../../domain/model/gateway-status.enum';
import { Gateway } from '../../../domain/model/gateway.entity';
import {
  IOT_DEVICE_DEFINITIONS,
  IoTMeasurementParameter,
} from '../../../domain/model/iot-device-definitions';
import { IoTDeviceStatus } from '../../../domain/model/iot-device-status.enum';
import { IoTDevice } from '../../../domain/model/iot-device.entity';
import { AssetManagementApi } from '../../../infrastructure/asset-management-api';

type OperationalParametersFeedback =
  | 'idle'
  | 'saved'
  | 'invalid'
  | 'incompatible'
  | 'access-denied'
  | 'server-error';

/**
 * @summary Presents the operational parameters settings user interface in the asset management bounded context.
 */
@Component({
  selector: 'app-operational-parameters-settings',
  imports: [MatButton, MatIcon, MatProgressSpinner, NgClass, ReactiveFormsModule, TranslatePipe],
  templateUrl: './operational-parameters-settings.html',
  styleUrl: './operational-parameters-settings.css',
})
export class OperationalParametersSettings implements OnInit {
  protected readonly identityAccessStore = inject(IdentityAccessStore);
  protected readonly assetManagementStore = inject(AssetManagementStore);
  private readonly identityAccessApi = inject(IdentityAccessApi);
  private readonly assetManagementApi = inject(AssetManagementApi);
  private readonly fb = inject(FormBuilder);

  protected readonly parameterKeys: IoTMeasurementParameter[] = [
    'temperature',
    'humidity',
    'motion',
    'image',
    'battery',
    'signal',
  ];
  protected readonly identityLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly feedback = signal<OperationalParametersFeedback>('idle');
  protected readonly selectedAssetId = signal(0);
  protected readonly selectedIoTDeviceId = signal(0);
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly assets = signal<Asset[]>([]);
  protected readonly iotDevices = signal<IoTDevice[]>([]);
  protected readonly gateways = signal<Gateway[]>([]);

  protected readonly operationalForm = this.fb.nonNullable.group({
    readingFrequencyMinutes: [60, [Validators.required, Validators.min(5), Validators.max(1440)]],
    temperature: [true],
    humidity: [true],
    motion: [false],
    image: [false],
    battery: [false],
    signal: [false],
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
  protected readonly canUpdateOperationalParameters = computed(() => {
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
  protected readonly monitoredAssets = computed(() => {
    const monitoredAssetIds = new Set(
      this.organizationIoTDevices()
        .filter((iotDevice) => iotDevice.assetId !== null)
        .map((iotDevice) => iotDevice.assetId as number),
    );

    return this.organizationAssets().filter((asset) => monitoredAssetIds.has(asset.id));
  });
  protected readonly selectedAsset = computed(() => {
    return this.organizationAssets().find((asset) => asset.id === this.selectedAssetId()) ?? null;
  });
  protected readonly selectedAssetDevices = computed(() => {
    const assetId = this.selectedAssetId();

    if (!assetId) {
      return [];
    }

    return this.organizationIoTDevices().filter((iotDevice) => iotDevice.assetId === assetId);
  });
  protected readonly selectedIoTDevice = computed(() => {
    return (
      this.organizationIoTDevices().find(
        (iotDevice) => iotDevice.id === this.selectedIoTDeviceId(),
      ) ?? null
    );
  });
  protected readonly selectedGateway = computed(() => {
    const asset = this.selectedAsset();

    if (!asset) {
      return null;
    }

    return this.gateways().find((gateway) => gateway.id === asset.gatewayId) ?? null;
  });
  protected readonly configuredDevices = computed(() => {
    return this.organizationIoTDevices()
      .filter((iotDevice) => iotDevice.assetId !== null)
      .sort((a, b) => this.assetNameFor(a).localeCompare(this.assetNameFor(b)));
  });
  protected readonly selectedIntervalLabel = computed(() => {
    const iotDevice = this.selectedIoTDevice();
    const seconds = iotDevice?.readingFrequencySeconds ?? 3600;

    return `${Math.round(seconds / 60)} min`;
  });
  protected readonly compatibilityIssueKey = computed(() => this.currentCompatibilityIssueKey());

  /**
   * @summary Initializes the operational parameters settings view state.
   */
  ngOnInit(): void {
    this.loadPageData();
  }

  protected loadPageData(): void {
    this.identityLoading.set(true);
    this.feedback.set('idle');
    this.assetManagementStore.loadIoTDevices();

    forkJoin({
      users: this.identityAccessApi.getUsers(),
      roles: this.identityAccessApi.getRoles(),
      organizations: this.identityAccessApi.getOrganizations(),
      assets: this.assetManagementApi.getAssets(),
      iotDevices: this.assetManagementApi.getIoTDevices(),
      gateways: this.assetManagementApi.getGateways(),
    })
      .pipe(finalize(() => this.identityLoading.set(false)))
      .subscribe({
        next: ({ users, roles, organizations, assets, iotDevices, gateways }) => {
          this.users.set(users);
          this.roles.set(roles);
          this.organizations.set(organizations);
          this.assets.set(assets);
          this.iotDevices.set(iotDevices);
          this.gateways.set(gateways);
          this.identityAccessStore.setCurrentRoleFrom(users, roles);
          this.identityAccessStore.setCurrentOrganizationFrom(users, organizations);
          this.identityAccessStore.initializeRolePermissions(roles);
          this.selectInitialScope();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected selectAsset(value: string): void {
    this.selectedAssetId.set(Number(value));
    this.feedback.set('idle');
    this.submitted.set(false);
    this.selectFirstDeviceForAsset();
  }

  protected selectIoTDevice(value: string): void {
    this.selectedIoTDeviceId.set(Number(value));
    this.feedback.set('idle');
    this.submitted.set(false);
    this.resetOperationalForm();
  }

  protected saveOperationalParameters(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.operationalForm.markAllAsTouched();

    if (!this.canUpdateOperationalParameters()) {
      this.feedback.set('access-denied');
      return;
    }

    if (this.operationalForm.invalid || !this.selectedIoTDevice() || !this.hasSelectedCriteria()) {
      this.feedback.set('invalid');
      return;
    }

    if (this.currentCompatibilityIssueKey()) {
      this.feedback.set('incompatible');
      return;
    }

    const currentDevice = this.selectedIoTDevice();

    if (!currentDevice) {
      this.feedback.set('server-error');
      return;
    }

    const parameters = this.selectedParameters();
    const nextDevice = new IoTDevice(
      currentDevice.id,
      currentDevice.organizationId,
      currentDevice.uuid,
      currentDevice.deviceType,
      currentDevice.model,
      this.measurementTypeLabel(parameters),
      currentDevice.assetId,
      currentDevice.status,
      currentDevice.calibrationStatus,
      currentDevice.lastCalibrationDate,
      currentDevice.nextCalibrationDate,
      parameters,
      Number(this.operationalForm.controls.readingFrequencyMinutes.value) * 60,
    );

    this.saving.set(true);
    this.assetManagementStore
      .updateIoTDevice(nextDevice)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updatedDevice) => {
          this.upsertLocalIoTDevice(updatedDevice);
          this.feedback.set('saved');
          this.submitted.set(false);
          this.operationalForm.markAsPristine();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected resetOperationalForm(): void {
    const iotDevice = this.selectedIoTDevice();
    const selectedParameters = iotDevice?.measurementParameters ?? [];

    this.feedback.set('idle');
    this.submitted.set(false);
    this.operationalForm.reset({
      readingFrequencyMinutes: Math.round((iotDevice?.readingFrequencySeconds ?? 3600) / 60),
      temperature: selectedParameters.includes('temperature'),
      humidity: selectedParameters.includes('humidity'),
      motion: selectedParameters.includes('motion'),
      image: selectedParameters.includes('image'),
      battery: selectedParameters.includes('battery'),
      signal: selectedParameters.includes('signal'),
    });
    this.parameterKeys.forEach((parameter) => {
      if (!this.isParameterSupported(parameter)) {
        this.operationalForm.controls[parameter].setValue(false);
      }
    });
    this.operationalForm.markAsPristine();
  }

  protected hasFrequencyError(): boolean {
    const control = this.operationalForm.controls.readingFrequencyMinutes;

    return control.invalid && (control.touched || this.submitted());
  }

  protected hasCriteriaError(): boolean {
    return this.submitted() && !this.hasSelectedCriteria();
  }

  protected isParameterSupported(parameter: IoTMeasurementParameter): boolean {
    return this.supportedParametersFor(this.selectedIoTDevice()).includes(parameter);
  }

  protected selectedParameters(): IoTMeasurementParameter[] {
    return this.parameterKeys.filter((parameter) => this.operationalForm.controls[parameter].value);
  }

  protected parameterLabelKey(parameter: string): string {
    return `asset-management.iot-devices.measurement-parameters.${parameter}`;
  }

  protected assetNameFor(iotDevice: IoTDevice): string {
    const asset = this.organizationAssets().find(
      (currentAsset) => currentAsset.id === iotDevice.assetId,
    );

    return asset ? `${asset.uuid} - ${asset.name}` : 'N/A';
  }

  protected assetLocationFor(iotDevice: IoTDevice): string {
    const asset = this.organizationAssets().find(
      (currentAsset) => currentAsset.id === iotDevice.assetId,
    );

    return asset ? this.assetManagementStore.locationForAsset(asset, this.gateways()) : 'N/A';
  }

  protected frequencyLabelFor(iotDevice: IoTDevice): string {
    return `${Math.round(iotDevice.readingFrequencySeconds / 60)} min`;
  }

  protected criteriaLabelFor(iotDevice: IoTDevice): string {
    return iotDevice.measurementParameters
      .map((parameter) => parameter.replace('-', ' '))
      .join(' / ');
  }

  protected operationalStatusKey(iotDevice: IoTDevice): string {
    const asset = this.organizationAssets().find(
      (currentAsset) => currentAsset.id === iotDevice.assetId,
    );
    const gateway = asset
      ? this.gateways().find((currentGateway) => currentGateway.id === asset.gatewayId)
      : null;

    if (!asset || asset.status !== AssetStatus.Active) {
      return 'asset-management.operational-parameters.table.status-asset-inactive';
    }

    if (iotDevice.status !== IoTDeviceStatus.Linked) {
      return 'asset-management.operational-parameters.table.status-device-unlinked';
    }

    if (!gateway || gateway.status === GatewayStatus.Offline) {
      return 'asset-management.operational-parameters.table.status-gateway-offline';
    }

    const supportedParameters = this.supportedParametersFor(iotDevice) as string[];

    if (
      iotDevice.measurementParameters.some((parameter) => !supportedParameters.includes(parameter))
    ) {
      return 'asset-management.operational-parameters.table.status-criteria-incompatible';
    }

    return 'asset-management.operational-parameters.table.status-active';
  }

  protected operationalStatusClass(iotDevice: IoTDevice): string {
    const statusKey = this.operationalStatusKey(iotDevice);

    if (statusKey.endsWith('status-active')) {
      return 'status-compliant';
    }

    return statusKey.endsWith('status-gateway-offline') ? 'status-danger' : 'status-observation';
  }

  private selectInitialScope(): void {
    const firstAsset = this.preferredInitialAsset();
    this.selectedAssetId.set(firstAsset?.id ?? 0);
    this.selectFirstDeviceForAsset();
  }

  private selectFirstDeviceForAsset(): void {
    const firstDevice = this.selectedAssetDevices()[0];
    this.selectedIoTDeviceId.set(firstDevice?.id ?? 0);
    this.resetOperationalForm();
  }

  private hasSelectedCriteria(): boolean {
    return this.selectedParameters().length > 0;
  }

  private preferredInitialAsset(): Asset | undefined {
    return (
      this.monitoredAssets().find((asset) => {
        const gateway = this.gateways().find(
          (currentGateway) => currentGateway.id === asset.gatewayId,
        );

        return (
          asset.status === AssetStatus.Active &&
          gateway?.status === GatewayStatus.Active &&
          this.organizationIoTDevices().some((iotDevice) => {
            return iotDevice.assetId === asset.id && iotDevice.status === IoTDeviceStatus.Linked;
          })
        );
      }) ?? this.monitoredAssets()[0]
    );
  }

  private currentCompatibilityIssueKey(): string | null {
    const asset = this.selectedAsset();
    const iotDevice = this.selectedIoTDevice();
    const gateway = this.selectedGateway();

    if (!asset || !iotDevice) {
      return null;
    }

    if (asset.status !== AssetStatus.Active) {
      return 'asset-management.operational-parameters.compatibility.asset-inactive';
    }

    if (iotDevice.assetId !== asset.id || iotDevice.status !== IoTDeviceStatus.Linked) {
      return 'asset-management.operational-parameters.compatibility.device-unlinked';
    }

    if (!gateway || gateway.status === GatewayStatus.Offline) {
      return 'asset-management.operational-parameters.compatibility.gateway-offline';
    }

    if (this.selectedParameters().some((parameter) => !this.isParameterSupported(parameter))) {
      return 'asset-management.operational-parameters.compatibility.criteria-incompatible';
    }

    return null;
  }

  private supportedParametersFor(iotDevice: IoTDevice | null): IoTMeasurementParameter[] {
    if (!iotDevice) {
      return [];
    }

    return (
      IOT_DEVICE_DEFINITIONS.find((definition) => definition.type === iotDevice.deviceType)
        ?.parameters ?? this.toKnownParameters(iotDevice.measurementParameters)
    );
  }

  private toKnownParameters(parameters: string[]): IoTMeasurementParameter[] {
    return parameters.filter((parameter): parameter is IoTMeasurementParameter => {
      return this.parameterKeys.includes(parameter as IoTMeasurementParameter);
    });
  }

  private measurementTypeLabel(parameters: IoTMeasurementParameter[]): string {
    const labelByParameter: Record<IoTMeasurementParameter, string> = {
      temperature: 'Temperature',
      humidity: 'Humidity',
      motion: 'Motion',
      image: 'Image',
      battery: 'Battery',
      signal: 'Signal',
    };

    return parameters.map((parameter) => labelByParameter[parameter]).join(' / ');
  }

  private upsertLocalIoTDevice(iotDevice: IoTDevice): void {
    this.iotDevices.update((currentDevices) => {
      return currentDevices.map((currentDevice) =>
        currentDevice.id === iotDevice.id ? iotDevice : currentDevice,
      );
    });
  }
}
