import { DrawingRegistry } from './DrawingRegistry';
import { Labels } from './Labels';
import { Zones } from './Zones';

export { BaseElement } from './BaseElement';
export { DrawingRegistry } from './DrawingRegistry';
export { Labels } from './Labels';
export { Zones } from './Zones';
export type { ContainerSelection, DiagramElement, DrawingSelection } from './types';
export type { Point, LabelDefinition, ZoneBorder, ZoneDefinition } from './definitions';

/** didi module contributing the drawing registry service. */
export const drawingRegistryModule = {
  __init__: ['drawingRegistry'],
  drawingRegistry: ['type', DrawingRegistry]
};

/** didi module contributing the label drawer. */
export const labelsModule = {
  __init__: ['labels'],
  labels: ['type', Labels],
  __depends__: [drawingRegistryModule]
};

/** didi module contributing the zone drawer. */
export const zonesModule = {
  __init__: ['zones'],
  zones: ['type', Zones],
  __depends__: [drawingRegistryModule, labelsModule]
};
