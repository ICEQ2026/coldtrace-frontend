import { computed, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Asset } from '../domain/model/asset.entity';
import { AssetManagementApi } from '../infrastructure/asset-management-api';

@Injectable({ providedIn: 'root' })
export class AssetManagementStore {
  private readonly assetsSignal = signal<Asset[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly assets = this.assetsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly assetCount = computed(() => this.assets().length);

  constructor(private assetManagementApi: AssetManagementApi) {}

  loadAssets(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.assetManagementApi.getAssets().subscribe({
      next: (assets) => {
        this.assetsSignal.set(assets);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  createAsset(asset: Asset): Observable<Asset> {
    return this.assetManagementApi.createAsset(asset).pipe(
      tap((createdAsset) => {
        this.assetsSignal.update((assets) => [...assets, createdAsset]);
      }),
    );
  }
}
