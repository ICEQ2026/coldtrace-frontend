import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemperatureGauge } from './temperature-gauge';

describe('TemperatureGauge', () => {
  let component: TemperatureGauge;
  let fixture: ComponentFixture<TemperatureGauge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemperatureGauge]
    }).compileComponents();

    fixture = TestBed.createComponent(TemperatureGauge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
