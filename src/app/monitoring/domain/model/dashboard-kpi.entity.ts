import { BaseEntity } from '../../../shared/domain/model/base-entity';

export interface DashboardKpiColor {
  bg: string;
  border: string;
  text: string;
  chart: string;
  chartLight?: string;
}

export interface DashboardKpiTooltip {
  text: string;
  position: number;
}

export class DashboardKpi implements BaseEntity {
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
  private _fillWave: boolean;
  private _waveFillColor: string;
  private _wavePath: string;
  private _waveFillPath: string;

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
    fillWave?: boolean;
    waveFillColor?: string;
    wavePath?: string;
    waveFillPath?: string;
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
    this._fillWave = kpi.fillWave ?? false;
    this._waveFillColor = kpi.waveFillColor ?? 'rgba(255,255,255,0.24)';
    this._wavePath = kpi.wavePath ?? '';
    this._waveFillPath = kpi.waveFillPath ?? '';
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
  get fillWave(): boolean { return this._fillWave; }
  get waveFillColor(): string { return this._waveFillColor; }
  get wavePath(): string { return this._wavePath; }
  get waveFillPath(): string { return this._waveFillPath; }
}
