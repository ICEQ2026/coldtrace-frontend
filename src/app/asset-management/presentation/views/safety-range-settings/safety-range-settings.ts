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
import { Asset } from '../../../domain/model/asset.entity';
import {
  buildDefaultAssetSettings,
  DEFAULT_ASSET_SETTING_VALUES,
} from '../../../domain/model/asset-settings-defaults';
import { AssetSettings } from '../../../domain/model/asset-settings.entity';
import { Gateway } from '../../../domain/model/gateway.entity';
import { IoTDevice } from '../../../domain/model/iot-device.entity';
import { AssetManagementApi } from '../../../infrastructure/asset-management-api';

type SafetyRangeFeedback = 'idle' | 'saved' | 'invalid' | 'access-denied' | 'server-error';

/**
 * @summary Presents the safety range settings user interface in the asset management bounded context.
 */
@Component({
  selector: 'app-safety-range-settings',
  imports: [MatButton, MatIcon, MatProgressSpinner, NgClass, ReactiveFormsModule, TranslatePipe],
  templateUrl: './safety-range-settings.html',
  styleUrl: './safety-range-settings.css',
})
export class SafetyRangeSettings implements OnInit {
  protected readonly identityAccessStore = inject(IdentityAccessStore);
  protected readonly assetManagementStore = inject(AssetManagementStore);
  private readonly identityAccessApi = inject(IdentityAccessApi);
  private readonly assetManagementApi = inject(AssetManagementApi);
  private readonly fb = inject(FormBuilder);

  protected readonly identityLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);
  protected readonly feedback = signal<SafetyRangeFeedback>('idle');
  protected readonly selectedAssetId = signal(0);
  protected readonly users = signal<User[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly organizations = signal<Organization[]>([]);
  protected readonly assets = signal<Asset[]>([]);
  protected readonly iotDevices = signal<IoTDevice[]>([]);
  protected readonly gateways = signal<Gateway[]>([]);
  protected readonly assetSettings = signal<AssetSettings[]>([]);
  protected readonly selectedMinimumTemperature = signal(
    DEFAULT_ASSET_SETTING_VALUES.minimumTemperature,
  );
  protected readonly selectedMaximumTemperature = signal(
    DEFAULT_ASSET_SETTING_VALUES.maximumTemperature,
  );
  protected readonly selectedMaximumHumidity = signal(DEFAULT_ASSET_SETTING_VALUES.maximumHumidity);

  protected readonly rangeForm = this.fb.nonNullable.group({
    minimumTemperature: [DEFAULT_ASSET_SETTING_VALUES.minimumTemperature, [Validators.required]],
    maximumTemperature: [DEFAULT_ASSET_SETTING_VALUES.maximumTemperature, [Validators.required]],
    maximumHumidity: [
      DEFAULT_ASSET_SETTING_VALUES.maximumHumidity,
      [Validators.required, Validators.min(1), Validators.max(100)],
    ],
  });

  protected readonly loading = computed(() => {
    return this.identityLoading() || this.saving();
  });
  protected readonly activeOrganizationId = computed(() => {
    return this.identityAccessStore.currentOrganizationIdFrom(this.users());
  });
  protected readonly activeOrganizationName = computed(() => {
    return this.identityAccessStore.currentOrganizationNameFrom(this.users(), this.organizations());
  });
  protected readonly currentRole = computed(() => {
    return this.identityAccessStore.currentRoleFrom(this.users(), this.roles());
  });
  protected readonly canManageSafetyRanges = computed(() => {
    return this.identityAccessStore.canManageAssets(this.users(), this.roles());
  });
  protected readonly organizationAssets = computed(() => {
    return this.assetManagementStore.assetsForOrganization(
      this.activeOrganizationId(),
      this.assets(),
    );
  });
  protected readonly monitoredAssets = computed(() => {
    return this.assetManagementStore.monitoredAssetsForOrganization(
      this.activeOrganizationId(),
      this.assets(),
      this.iotDevices(),
    );
  });
  protected readonly organizationSettings = computed(() => {
    return this.assetManagementStore.assetSettingsForOrganization(
      this.activeOrganizationId(),
      this.assetSettings(),
    );
  });
  protected readonly assetSpecificSettingsCount = computed(() => {
    return this.organizationSettings().filter((settings) => settings.assetId !== null).length;
  });
  protected readonly selectedAsset = computed(() => {
    const selectedAssetId = this.selectedAssetId();

    if (!selectedAssetId) {
      return null;
    }

    return this.organizationAssets().find((asset) => asset.id === selectedAssetId) ?? null;
  });
  protected readonly selectedSettings = computed(() => {
    return this.settingsForSelectedScope() ?? this.defaultSettingsForSelectedScope();
  });
  protected readonly currentRangeLabel = computed(() => {
    const settings = this.selectedSettings();

    return this.temperatureRangeLabel(
      settings.minimumTemperature,
      settings.maximumTemperature,
      settings.temperatureUnit,
    );
  });
  protected readonly selectedRangeLabel = computed(() => {
    return this.temperatureRangeLabel(
      this.selectedMinimumTemperature(),
      this.selectedMaximumTemperature(),
      this.selectedSettings().temperatureUnit,
    );
  });
  protected readonly selectedHumidityLabel = computed(() => {
    return this.humidityLabel(this.selectedMaximumHumidity(), this.selectedSettings().humidityUnit);
  });
  protected readonly currentProfiles = computed(() => {
    return this.organizationSettings().sort((a, b) => {
      if (a.assetId === null) return -1;
      if (b.assetId === null) return 1;
      return this.scopeNameFor(a).localeCompare(this.scopeNameFor(b));
    });
  });

  /**
   * @summary Initializes the safety range settings view state.
   */
  ngOnInit(): void {
    this.loadPageData();
  }

  protected loadPageData(): void {
    this.identityLoading.set(true);
    this.feedback.set('idle');
    this.assetManagementStore.loadAssetSettings();

    forkJoin({
      users: this.identityAccessApi.getUsers(),
      roles: this.identityAccessApi.getRoles(),
      organizations: this.identityAccessApi.getOrganizations(),
      assets: this.assetManagementApi.getAssets(),
      iotDevices: this.assetManagementApi.getIoTDevices(),
      gateways: this.assetManagementApi.getGateways(),
      assetSettings: this.assetManagementApi.getAssetSettings(),
    })
      .pipe(finalize(() => this.identityLoading.set(false)))
      .subscribe({
        next: ({ users, roles, organizations, assets, iotDevices, gateways, assetSettings }) => {
          this.users.set(users);
          this.roles.set(roles);
          this.organizations.set(organizations);
          this.assets.set(assets);
          this.iotDevices.set(iotDevices);
          this.gateways.set(gateways);
          this.assetSettings.set(assetSettings);
          this.identityAccessStore.setCurrentContextFrom(users, roles, organizations);
          this.resetRangeForm();
        },
        error: () => this.feedback.set('server-error'),
      });
  }

  protected selectScope(value: string): void {
    this.selectedAssetId.set(Number(value));
    this.feedback.set('idle');
    this.submitted.set(false);
    this.resetRangeForm();
  }

  protected updateMinimumTemperaturePreview(value: string): void {
    this.selectedMinimumTemperature.set(this.numberFromInput(value));
  }

  protected updateMaximumTemperaturePreview(value: string): void {
    this.selectedMaximumTemperature.set(this.numberFromInput(value));
  }

  protected updateMaximumHumidityPreview(value: string): void {
    this.selectedMaximumHumidity.set(this.numberFromInput(value));
  }

  protected saveRangeSettings(): void {
    this.submitted.set(true);
    this.feedback.set('idle');
    this.rangeForm.markAllAsTouched();

    if (!this.canManageSafetyRanges()) {
      this.feedback.set('access-denied');
      return;
    }

    if (this.rangeForm.invalid || !this.hasValidTemperatureRange()) {
      this.feedback.set('invalid');
      return;
    }

    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      this.feedback.set('server-error');
      return;
    }

    const assetId = this.selectedAssetId() || null;
    const currentSettings = this.settingsForScope(assetId);
    const fallbackSettings = currentSettings ?? this.defaultSettingsForSelectedScope();
    const nextSettings = new AssetSettings(
      currentSettings?.id ?? this.nextSettingsId(),
      organizationId,
      currentSettings?.uuid ?? this.generatedSettingsUuid(organizationId, assetId),
      fallbackSettings.assetTypes,
      fallbackSettings.iotDeviceTypes,
      Number(this.rangeForm.controls.minimumTemperature.value),
      Number(this.rangeForm.controls.maximumTemperature.value),
      Number(this.rangeForm.controls.maximumHumidity.value),
      fallbackSettings.calibrationFrequencyDays,
      fallbackSettings.temperatureUnit,
      fallbackSettings.humidityUnit,
      fallbackSettings.weightUnit,
      assetId,
    );
    const request = currentSettings
      ? this.assetManagementStore.updateAssetSettings(nextSettings)
      : this.assetManagementStore.createAssetSettings(nextSettings);

    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (savedSettings) => {
        this.upsertLocalSettings(savedSettings);
        this.assetManagementStore.loadAssetSettings();
        this.feedback.set('saved');
        this.submitted.set(false);
        this.rangeForm.markAsPristine();
      },
      error: () => this.feedback.set('server-error'),
    });
  }

  protected resetRangeForm(): void {
    const settings = this.selectedSettings();

    this.feedback.set('idle');
    this.submitted.set(false);
    this.rangeForm.reset({
      minimumTemperature: settings.minimumTemperature,
      maximumTemperature: settings.maximumTemperature,
      maximumHumidity: settings.maximumHumidity,
    });
    this.selectedMinimumTemperature.set(settings.minimumTemperature);
    this.selectedMaximumTemperature.set(settings.maximumTemperature);
    this.selectedMaximumHumidity.set(settings.maximumHumidity);
    this.rangeForm.markAsPristine();
  }

  protected hasRangeControlError(controlName: keyof typeof this.rangeForm.controls): boolean {
    const control = this.rangeForm.controls[controlName];

    return control.invalid && (control.touched || this.submitted());
  }

  protected hasTemperatureRangeError(): boolean {
    return this.submitted() && !this.hasValidTemperatureRange();
  }

  protected scopeNameFor(settings: AssetSettings): string {
    if (settings.assetId === null) {
      return 'asset-management.safety-ranges.scope-default';
    }

    const asset = this.organizationAssets().find(
      (currentAsset) => currentAsset.id === settings.assetId,
    );

    return asset ? `${asset.uuid} - ${asset.name}` : `#${settings.assetId}`;
  }

  protected scopeLocationFor(settings: AssetSettings): string {
    if (settings.assetId === null) {
      return 'asset-management.safety-ranges.scope-default-description';
    }

    const asset = this.organizationAssets().find(
      (currentAsset) => currentAsset.id === settings.assetId,
    );

    return asset ? this.assetManagementStore.locationForAsset(asset, this.gateways()) : 'N/A';
  }

  protected settingStatusKey(settings: AssetSettings): string {
    return settings.assetId === null
      ? 'asset-management.safety-ranges.table.default-status'
      : 'asset-management.safety-ranges.table.asset-status';
  }

  protected settingStatusClass(settings: AssetSettings): string {
    return settings.assetId === null ? 'status-compliant' : 'status-observation';
  }

  private hasValidTemperatureRange(): boolean {
    const minimumTemperature = Number(this.rangeForm.controls.minimumTemperature.value);
    const maximumTemperature = Number(this.rangeForm.controls.maximumTemperature.value);

    return minimumTemperature < maximumTemperature;
  }

  private settingsForSelectedScope(): AssetSettings | undefined {
    return this.settingsForScope(this.selectedAssetId() || null);
  }

  private settingsForScope(assetId: number | null): AssetSettings | undefined {
    const organizationId = this.activeOrganizationId();

    if (!organizationId) {
      return undefined;
    }

    return this.organizationSettings().find((settings) => settings.assetId === assetId);
  }

  private defaultSettingsForSelectedScope(): AssetSettings {
    const organizationId = this.activeOrganizationId() ?? 0;
    const assetId = this.selectedAssetId() || null;
    const organizationDefault =
      this.settingsForScope(null) ?? this.organizationSettings()[0] ?? null;

    return buildDefaultAssetSettings(
      organizationDefault?.id ?? this.nextSettingsId(),
      organizationId,
      organizationDefault?.uuid ?? this.generatedSettingsUuid(organizationId, assetId),
      assetId,
      organizationDefault,
    );
  }

  private nextSettingsId(): number {
    const localMax = Math.max(...this.assetSettings().map((settings) => settings.id), 0);
    const storeMax = this.assetManagementStore.nextAssetSettingsId() - 1;

    return Math.max(localMax, storeMax) + 1;
  }

  private generatedSettingsUuid(organizationId: number, assetId: number | null): string {
    const organizationPart = organizationId.toString().padStart(3, '0');

    if (!assetId) {
      return `CFG-${organizationPart}`;
    }

    return `CFG-${organizationPart}-A${assetId.toString().padStart(3, '0')}`;
  }

  private temperatureRangeLabel(
    minimumTemperature: number,
    maximumTemperature: number,
    temperatureUnit: string,
  ): string {
    if (!Number.isFinite(minimumTemperature) || !Number.isFinite(maximumTemperature)) {
      return 'N/A';
    }

    return `${minimumTemperature}${temperatureUnit} - ${maximumTemperature}${temperatureUnit}`;
  }

  private humidityLabel(maximumHumidity: number, humidityUnit: string): string {
    return Number.isFinite(maximumHumidity) ? `${maximumHumidity}${humidityUnit}` : 'N/A';
  }

  private numberFromInput(value: string): number {
    const numericValue = Number(value);

    return value.trim() && Number.isFinite(numericValue) ? numericValue : Number.NaN;
  }

  private upsertLocalSettings(settings: AssetSettings): void {
    this.assetSettings.update((currentSettings) => {
      const exists = currentSettings.some((current) => current.id === settings.id);

      if (!exists) {
        return [...currentSettings, settings];
      }

      return currentSettings.map((current) => (current.id === settings.id ? settings : current));
    });
  }
}
