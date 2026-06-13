import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { IncidentsChart } from './incidents-chart';

describe('IncidentsChart', () => {
  let component: IncidentsChart;
  let fixture: ComponentFixture<IncidentsChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsChart],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentsChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
