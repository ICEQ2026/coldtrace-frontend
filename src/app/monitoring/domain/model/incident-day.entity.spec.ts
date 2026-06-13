import { IncidentDay } from './incident-day.entity';

describe('IncidentDay', () => {
  it('should create an instance', () => {
    expect(
      new IncidentDay({
        id: 1,
        label: 'Mon',
        normal: 4,
        warning: 1,
        critical: 0,
        offline: 0,
      }),
    ).toBeTruthy();
  });
});
