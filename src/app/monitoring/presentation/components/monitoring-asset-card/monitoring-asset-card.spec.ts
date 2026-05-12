import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Asset } from '../../../../asset-management/domain/model/asset.entity';
import { AssetStatus } from '../../../../asset-management/domain/model/asset-status.enum';
import { AssetType } from '../../../../asset-management/domain/model/asset-type.enum';
import { ConnectivityStatus } from '../../../../asset-management/domain/model/connectivity-status.enum';
import { MonitoringAssetCard } from './monitoring-asset-card';

describe('MonitoringAssetCard', () => {
  let component: MonitoringAssetCard;
  let fixture: ComponentFixture<MonitoringAssetCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoringAssetCard]
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoringAssetCard);
    component = fixture.componentInstance;
    component.asset = new Asset(
      1,
      1,
      'CR-001',
      AssetType.ColdRoom,
      null,
      'Cold Room 01',
      'San Miguel',
      1200,
      'Main cold room',
      AssetStatus.Active,
      'none',
      '4.2°C',
      '2026-05-12',
      ConnectivityStatus.Online,
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
