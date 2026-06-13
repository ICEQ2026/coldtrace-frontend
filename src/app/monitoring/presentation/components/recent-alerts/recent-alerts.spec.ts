import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { RecentAlerts } from './recent-alerts';

describe('RecentAlerts', () => {
  let component: RecentAlerts;
  let fixture: ComponentFixture<RecentAlerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentAlerts],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentAlerts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
