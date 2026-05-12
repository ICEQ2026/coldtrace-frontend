import { computed, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MaintenanceSchedule } from '../domain/model/maintenance-schedule.entity';
import { MaintenanceScheduleStatus } from '../domain/model/maintenance-schedule-status.enum';
import { MaintenanceManagementApi } from '../infrastructure/maintenance-management-api';

@Injectable({ providedIn: 'root' })
export class MaintenanceManagementStore {
  private readonly maintenanceSchedulesSignal = signal<MaintenanceSchedule[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly maintenanceSchedules = this.maintenanceSchedulesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly pendingCount = computed(() => {
    return this.maintenanceSchedules().filter((schedule) => this.isOpenSchedule(schedule)).length;
  });

  constructor(private maintenanceManagementApi: MaintenanceManagementApi) {}

  loadMaintenanceSchedules(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.maintenanceManagementApi.getMaintenanceSchedules().subscribe({
      next: (maintenanceSchedules) => {
        this.maintenanceSchedulesSignal.set(maintenanceSchedules);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      },
    });
  }

  createMaintenanceSchedule(
    maintenanceSchedule: MaintenanceSchedule,
  ): Observable<MaintenanceSchedule> {
    return this.maintenanceManagementApi.createMaintenanceSchedule(maintenanceSchedule).pipe(
      tap((createdSchedule) => {
        this.maintenanceSchedulesSignal.update((schedules) => [...schedules, createdSchedule]);
      }),
    );
  }

  updateMaintenanceSchedule(
    maintenanceSchedule: MaintenanceSchedule,
  ): Observable<MaintenanceSchedule> {
    return this.maintenanceManagementApi.updateMaintenanceSchedule(maintenanceSchedule).pipe(
      tap((updatedSchedule) => {
        this.maintenanceSchedulesSignal.update((schedules) =>
          schedules.map((schedule) =>
            schedule.id === updatedSchedule.id ? updatedSchedule : schedule,
          ),
        );
      }),
    );
  }

  schedulesForOrganization(organizationId: number | null): MaintenanceSchedule[] {
    if (!organizationId) {
      return [];
    }

    return this.maintenanceSchedules().filter(
      (schedule) => schedule.organizationId === organizationId,
    );
  }

  nextScheduleId(): number {
    return Math.max(...this.maintenanceSchedules().map((schedule) => schedule.id), 0) + 1;
  }

  hasOpenScheduleForAssetPeriod(
    organizationId: number | null,
    assetId: number,
    period: string,
  ): boolean {
    return this.schedulesForOrganization(organizationId).some((schedule) => {
      return (
        schedule.assetId === assetId && schedule.period === period && this.isOpenSchedule(schedule)
      );
    });
  }

  private isOpenSchedule(schedule: MaintenanceSchedule): boolean {
    return (
      schedule.status === MaintenanceScheduleStatus.Scheduled ||
      schedule.status === MaintenanceScheduleStatus.Pending
    );
  }
}
