export type OperationalHistoryEventType = 'reading' | 'alert' | 'incident';
export type OperationalHistorySeverity = 'normal' | 'warning' | 'critical' | 'info';
export type OperationalHistoryFilterType = OperationalHistoryEventType | 'all';

export interface OperationalHistoryFilters {
  assetId: number;
  fromDate: string;
  toDate: string;
  eventType: OperationalHistoryFilterType;
}

export interface OperationalHistoryEvent {
  id: number;
  assetId: number;
  assetName: string;
  assetLocation: string;
  eventType: OperationalHistoryEventType;
  severity: OperationalHistorySeverity;
  icon: string;
  occurredAt: string;
  value: string;
  messageKey: string;
  messageParams: Record<string, string | number>;
}

export class OperationalHistory {
  constructor(
    public filters: OperationalHistoryFilters,
    public events: OperationalHistoryEvent[],
  ) {}

  get totalEvents(): number {
    return this.events.length;
  }

  get readingsCount(): number {
    return this.events.filter((event) => event.eventType === 'reading').length;
  }

  get alertsCount(): number {
    return this.events.filter((event) => event.eventType === 'alert').length;
  }

  get incidentsCount(): number {
    return this.events.filter((event) => event.eventType === 'incident').length;
  }
}
