import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentsChart } from './incidents-chart';

describe('IncidentsChart', () => {
  let component: IncidentsChart;
  let fixture: ComponentFixture<IncidentsChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsChart],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentsChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
