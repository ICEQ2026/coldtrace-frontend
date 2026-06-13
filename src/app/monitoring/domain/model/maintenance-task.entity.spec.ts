import { MaintenanceTask } from './maintenance-task.entity';

describe('MaintenanceTask', () => {
  it('should create an instance', () => {
    expect(
      new MaintenanceTask({
        id: 1,
        label: 'Check sensor',
        icon: 'build',
        status: 'to-do',
      }),
    ).toBeTruthy();
  });
});
