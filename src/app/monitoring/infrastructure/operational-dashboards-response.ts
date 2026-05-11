import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { DashboardKpiColor, DashboardKpiTooltip } from '../domain/model/dashboard-kpi.entity';

export interface DashboardKpiResource extends BaseResource {
  key: string;
  title: string;
  value: string;
  valueUnit?: string;
  trend?: string;
  size: 'large' | 'small';
  type?: 'bars' | 'wave';
  color: DashboardKpiColor;
  tooltip: DashboardKpiTooltip;
  chartData: number[];
  highlightedBar?: number;
  showAnchor?: boolean;
  fillWave?: boolean;
  waveFillColor?: string;
  wavePath?: string;
  waveFillPath?: string;
}

export interface TemperaturePointResource extends BaseResource {
  label: string;
  temperature: number;
  ghost: number;
  maxLimit: number;
  minLimit: number;
}

export interface StorageDistributionItemResource extends BaseResource {
  label: string;
  assetCount: number;
  percentage: number;
  color: string;
}

export interface MaintenanceTaskResource extends BaseResource {
  label: string;
  icon: string;
  status: 'to-do' | 'doing' | 'done';
}

export interface RecentAlertResource extends BaseResource {
  assetName: string;
  type: string;
  value: string;
  date: string;
  status: 'Acknowledged' | 'Unacknowledged';
  severity: 'warning' | 'critical' | 'info';
  icon: string;
}

export interface IncidentDayResource extends BaseResource {
  label: string;
  normal: number;
  warning: number;
  critical: number;
  offline: number;
}

export interface OperationalDashboardResource extends BaseResource {
  temperatureTitle: string;
  temperatureSubtitle: string;
  kpis: DashboardKpiResource[];
  temperaturePoints: TemperaturePointResource[];
  storageDistribution: StorageDistributionItemResource[];
  maintenanceTasks: MaintenanceTaskResource[];
  maintenanceCompletionRate: number;
  recentAlerts: RecentAlertResource[];
  incidentDays: IncidentDayResource[];
  timeline: IncidentDayResource[];
}

export interface OperationalDashboardsResponse extends BaseResponse {
  operationalDashboards: OperationalDashboardResource[];
}
