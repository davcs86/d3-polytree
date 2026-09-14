import { DrawingRegistry } from './DrawingRegistry';
import { Labels } from './Labels';
import { Zones } from './Zones';
import { Links } from './Links';
import { Markers } from './Markers';
import { createDefs } from './Defs';

export { BaseElement } from './BaseElement';
export { DrawingRegistry } from './DrawingRegistry';
export { Labels } from './Labels';
export { Zones } from './Zones';
export { Links } from './Links';
export { Markers } from './Markers';
export { createDefs } from './Defs';
export type { DefsSelection } from './Defs';
export type { ContainerSelection, DiagramElement, DrawingSelection } from './types';
export type { LabelDefinition, LinkDefinition, Point, ZoneBorder, ZoneDefinition } from './definitions';

/** didi module contributing the drawing registry service. */
export const drawingRegistryModule = {
  __init__: ['drawingRegistry'],
  drawingRegistry: ['type', DrawingRegistry]
};

/** didi module contributing the shared `<defs>` element. */
export const defsModule = {
  __init__: ['defs'],
  defs: ['factory', createDefs]
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

/** didi module contributing arrowhead markers. */
export const markersModule = {
  __init__: ['markers'],
  markers: ['type', Markers],
  __depends__: [defsModule]
};

/** didi module contributing the link drawer. */
export const linksModule = {
  __init__: ['links'],
  links: ['type', Links],
  __depends__: [drawingRegistryModule, markersModule]
};
