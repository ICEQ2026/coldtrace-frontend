import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DashboardKpi } from '../domain/model/dashboard-kpi.entity';
import { IncidentDay } from '../domain/model/incident-day.entity';
import { MaintenanceTask } from '../domain/model/maintenance-task.entity';
import { OperationalDashboardData } from '../domain/model/operational-dashboard-data.entity';
import { RecentAlert } from '../domain/model/recent-alert.entity';
import { StorageDistributionItem } from '../domain/model/storage-distribution-item.entity';
import { TemperaturePoint } from '../domain/model/temperature-point.entity';
import { OperationalDashboardResource, OperationalDashboardsResponse } from './operational-dashboards-response';

export class OperationalDashboardAssembler implements BaseAssembler<OperationalDashboardData, OperationalDashboardResource, OperationalDashboardsResponse> {
  toEntityFromResource(resource: OperationalDashboardResource): OperationalDashboardData {
    return new OperationalDashboardData({
      id: resource.id,
      temperatureTitle: resource.temperatureTitle,
      temperatureSubtitle: resource.temperatureSubtitle,
      kpis: resource.kpis.map(kpi => new DashboardKpi(kpi)),
      temperaturePoints: resource.temperaturePoints.map(point => new TemperaturePoint(point)),
      storageDistribution: resource.storageDistribution.map(item => new StorageDistributionItem(item)),
      maintenanceTasks: resource.maintenanceTasks.map(task => new MaintenanceTask(task)),
      maintenanceCompletionRate: resource.maintenanceCompletionRate,
      recentAlerts: resource.recentAlerts.map(alert => new RecentAlert(alert)),
      incidentDays: resource.incidentDays.map(day => new IncidentDay(day)),
      timeline: resource.timeline.map(day => new IncidentDay(day)),
    });
  }

  toResourceFromEntity(entity: OperationalDashboardData): OperationalDashboardResource {
    return {
      id: entity.id,
      temperatureTitle: entity.temperatureTitle,
      temperatureSubtitle: entity.temperatureSubtitle,
      kpis: entity.kpis.map(kpi => ({
        id: kpi.id,
        key: kpi.key,
        title: kpi.title,
        value: kpi.value,
        valueUnit: kpi.valueUnit,
        trend: kpi.trend,
        size: kpi.size,
        type: kpi.type,
        color: kpi.color,
        tooltip: kpi.tooltip,
        chartData: kpi.chartData,
        highlightedBar: kpi.highlightedBar,
        showAnchor: kpi.showAnchor,
        fillWave: kpi.fillWave,
        waveFillColor: kpi.waveFillColor,
        wavePath: kpi.wavePath,
        waveFillPath: kpi.waveFillPath,
      })),
      temperaturePoints: entity.temperaturePoints.map(point => ({
        id: point.id,
        label: point.label,
        temperature: point.temperature,
        ghost: point.ghost,
        maxLimit: point.maxLimit,
        minLimit: point.minLimit,
      })),
      storageDistribution: entity.storageDistribution.map(item => ({
        id: item.id,
        label: item.label,
        assetCount: item.assetCount,
        percentage: item.percentage,
        color: item.color,
      })),
      maintenanceTasks: entity.maintenanceTasks.map(task => ({
        id: task.id,
        label: task.label,
        icon: task.icon,
        status: task.status,
      })),
      maintenanceCompletionRate: entity.maintenanceCompletionRate,
      recentAlerts: entity.recentAlerts.map(alert => ({
        id: alert.id,
        assetName: alert.assetName,
        type: alert.type,
        value: alert.value,
        date: alert.date,
        status: alert.status,
        severity: alert.severity,
        icon: alert.icon,
      })),
      incidentDays: entity.incidentDays.map(day => ({
        id: day.id,
        label: day.label,
        normal: day.normal,
        warning: day.warning,
        critical: day.critical,
        offline: day.offline,
      })),
      timeline: entity.timeline.map(day => ({
        id: day.id,
        label: day.label,
        normal: day.normal,
        warning: day.warning,
        critical: day.critical,
        offline: day.offline,
      })),
    };
  }

  toEntitiesFromResponse(response: OperationalDashboardsResponse): OperationalDashboardData[] {
    return response.operationalDashboards.map(resource => this.toEntityFromResource(resource));
  }
}
