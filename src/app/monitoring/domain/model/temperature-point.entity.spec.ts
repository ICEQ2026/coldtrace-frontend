import { TemperaturePoint } from './temperature-point.entity';

describe('TemperaturePoint', () => {
  it('should create an instance', () => {
    expect(
      new TemperaturePoint({
        id: 1,
        label: '08:00',
        temperature: 2.4,
        ghost: 0,
        maxLimit: 8,
        minLimit: 0,
      }),
    ).toBeTruthy();
  });
});
