import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TemperatureGauge } from './temperature-gauge';

describe('TemperatureGauge', () => {
  let component: TemperatureGauge;
  let fixture: ComponentFixture<TemperatureGauge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemperatureGauge],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(TemperatureGauge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
