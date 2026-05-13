/**
 * @summary Presents the dashboard kpi color user interface in the monitoring bounded context.
 */
export interface DashboardKpiColor {
  bg: string;
  border: string;
  text: string;
  chart: string;
  chartLight?: string;
}

/**
 * @summary Presents the dashboard kpi tooltip user interface in the monitoring bounded context.
 */
export interface DashboardKpiTooltip {
  text: string;
  position: number;
}

/**
 * @summary Presents the dashboard kpi user interface in the monitoring bounded context.
 */
export class DashboardKpi {
  private _id: number;
  private _key: string;
  private _title: string;
  private _value: string;
  private _valueUnit: string;
  private _trend: string;
  private _size: 'large' | 'small';
  private _type: 'bars' | 'wave';
  private _color: DashboardKpiColor;
  private _tooltip: DashboardKpiTooltip;
  private _chartData: number[];
  private _highlightedBar: number;
  private _showAnchor: boolean;

  constructor(kpi: {
    id: number;
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
  }) {
    this._id = kpi.id;
    this._key = kpi.key;
    this._title = kpi.title;
    this._value = kpi.value;
    this._valueUnit = kpi.valueUnit ?? '';
    this._trend = kpi.trend ?? '';
    this._size = kpi.size;
    this._type = kpi.type ?? 'bars';
    this._color = kpi.color;
    this._tooltip = kpi.tooltip;
    this._chartData = kpi.chartData;
    this._highlightedBar = kpi.highlightedBar ?? -1;
    this._showAnchor = kpi.showAnchor ?? false;
  }

  get id(): number { return this._id; }
  get key(): string { return this._key; }
  get title(): string { return this._title; }
  get value(): string { return this._value; }
  get valueUnit(): string { return this._valueUnit; }
  get trend(): string { return this._trend; }
  get size(): 'large' | 'small' { return this._size; }
  get type(): 'bars' | 'wave' { return this._type; }
  get color(): DashboardKpiColor { return this._color; }
  get tooltip(): DashboardKpiTooltip { return this._tooltip; }
  get chartData(): number[] { return this._chartData; }
  get highlightedBar(): number { return this._highlightedBar; }
  get showAnchor(): boolean { return this._showAnchor; }
}
