import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { MaintenanceList } from './maintenance-list';

describe('MaintenanceList', () => {
  let component: MaintenanceList;
  let fixture: ComponentFixture<MaintenanceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceList],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenanceList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
