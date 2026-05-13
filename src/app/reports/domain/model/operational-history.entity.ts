/**
 * @summary Defines the allowed operational history event type values used by the reports bounded context.
 */
export type OperationalHistoryEventType = 'reading' | 'alert' | 'incident';
/**
 * @summary Defines the allowed operational history severity values used by the reports bounded context.
 */
export type OperationalHistorySeverity = 'normal' | 'warning' | 'critical' | 'info';
/**
 * @summary Defines the allowed operational history filter type values used by the reports bounded context.
 */
export type OperationalHistoryFilterType = OperationalHistoryEventType | 'all';

/**
 * @summary Defines the operational history filters contract used by the reports bounded context.
 */
export interface OperationalHistoryFilters {
  assetId: number;
  fromDate: string;
  toDate: string;
  eventType: OperationalHistoryFilterType;
}

/**
 * @summary Defines the operational history event contract used by the reports bounded context.
 */
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

/**
 * @summary Represents an operational history in the reports bounded context.
 */
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
