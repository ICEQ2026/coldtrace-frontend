import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { StorageDistribution } from './storage-distribution';

describe('StorageDistribution', () => {
  let component: StorageDistribution;
  let fixture: ComponentFixture<StorageDistribution>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageDistribution],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(StorageDistribution);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
