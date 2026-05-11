import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { DashboardKpi } from './dashboard-kpi.entity';
import { TemperaturePoint } from './temperature-point.entity';
import { StorageDistributionItem } from './storage-distribution-item.entity';
import { MaintenanceTask } from './maintenance-task.entity';
import { RecentAlert } from './recent-alert.entity';
import { IncidentDay } from './incident-day.entity';

export class OperationalDashboardData implements BaseEntity {
  private _id: number;
  private _temperatureTitle: string;
  private _temperatureSubtitle: string;
  private _kpis: DashboardKpi[];
  private _temperaturePoints: TemperaturePoint[];
  private _storageDistribution: StorageDistributionItem[];
  private _maintenanceTasks: MaintenanceTask[];
  private _maintenanceCompletionRate: number;
  private _recentAlerts: RecentAlert[];
  private _incidentDays: IncidentDay[];
  private _timeline: IncidentDay[];

  constructor(data: {
    id: number;
    temperatureTitle: string;
    temperatureSubtitle: string;
    kpis: DashboardKpi[];
    temperaturePoints: TemperaturePoint[];
    storageDistribution: StorageDistributionItem[];
    maintenanceTasks: MaintenanceTask[];
    maintenanceCompletionRate: number;
    recentAlerts: RecentAlert[];
    incidentDays: IncidentDay[];
    timeline: IncidentDay[];
  }) {
    this._id = data.id;
    this._temperatureTitle = data.temperatureTitle;
    this._temperatureSubtitle = data.temperatureSubtitle;
    this._kpis = data.kpis;
    this._temperaturePoints = data.temperaturePoints;
    this._storageDistribution = data.storageDistribution;
    this._maintenanceTasks = data.maintenanceTasks;
    this._maintenanceCompletionRate = data.maintenanceCompletionRate;
    this._recentAlerts = data.recentAlerts;
    this._incidentDays = data.incidentDays;
    this._timeline = data.timeline;
  }

  get id(): number { return this._id; }
  get temperatureTitle(): string { return this._temperatureTitle; }
  get temperatureSubtitle(): string { return this._temperatureSubtitle; }
  get kpis(): DashboardKpi[] { return this._kpis; }
  get temperaturePoints(): TemperaturePoint[] { return this._temperaturePoints; }
  get storageDistribution(): StorageDistributionItem[] { return this._storageDistribution; }
  get maintenanceTasks(): MaintenanceTask[] { return this._maintenanceTasks; }
  get maintenanceCompletionRate(): number { return this._maintenanceCompletionRate; }
  get recentAlerts(): RecentAlert[] { return this._recentAlerts; }
  get incidentDays(): IncidentDay[] { return this._incidentDays; }
  get timeline(): IncidentDay[] { return this._timeline; }

  getKpiByKey(key: string): DashboardKpi | undefined {
    return this._kpis.find(kpi => kpi.key === key);
  }
}
