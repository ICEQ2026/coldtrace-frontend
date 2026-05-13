/**
 * @summary Defines the allowed IoT measurement parameter values used by the asset management bounded context.
 */
export type IoTMeasurementParameter =
  | 'temperature'
  | 'humidity'
  | 'motion'
  | 'image'
  | 'battery'
  | 'signal';

/**
 * @summary Defines the IoT device definition contract used by the asset management bounded context.
 */
export interface IoTDeviceDefinition {
  type: string;
  modelPlaceholder: string;
  parameters: IoTMeasurementParameter[];
}

/**
 * @summary Catalog of supported IoT device definitions used by asset forms and dashboards.
 */
export const IOT_DEVICE_DEFINITIONS: IoTDeviceDefinition[] = [
  {
    type: 'temperature-sensor',
    modelPlaceholder: 'TempSense T100',
    parameters: ['temperature', 'battery', 'signal'],
  },
  {
    type: 'humidity-sensor',
    modelPlaceholder: 'HumidSense H200',
    parameters: ['humidity', 'temperature', 'battery', 'signal'],
  },
  {
    type: 'motion-sensor',
    modelPlaceholder: 'MoveSense M100',
    parameters: ['motion', 'battery', 'signal'],
  },
  {
    type: 'camera',
    modelPlaceholder: 'ColdCam C1',
    parameters: ['image', 'motion', 'battery', 'signal'],
  },
  {
    type: 'multi-sensor',
    modelPlaceholder: 'TraceSense M2',
    parameters: ['temperature', 'humidity', 'motion', 'battery', 'signal'],
  },
];
