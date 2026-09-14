import { MouseEvents } from './mouseEvents';
import { Selection } from './selection';
import { Zoom } from './zoom';
import { ZoomScroll } from './zoomScroll';
import { calculateCenterModule } from '../utils/calculateCenter';

export * from './notifications';
export { MouseEvents } from './mouseEvents';
export { Selection } from './selection';
export type { SelectionEntry } from './selection';
export { Zoom } from './zoom';
export { ZoomScroll } from './zoomScroll';

/**
 * didi module contributing the mouse-event bridge: re-emits DOM mouse events on
 * drawn elements as typed `<class>.<kind>` bus events.
 */
export const mouseEventsModule = {
  __init__: ['mouseEvents'],
  mouseEvents: ['type', MouseEvents]
};

/** didi module contributing element selection tracking. */
export const selectionModule = {
  __init__: ['selection'],
  selection: ['type', Selection],
  __depends__: [mouseEventsModule]
};

/** didi module contributing pan/zoom on the canvas drawing layer. */
export const zoomModule = {
  __init__: ['zoom'],
  zoom: ['type', Zoom],
  __depends__: [calculateCenterModule]
};

/** didi module enabling interactive scroll/drag zoom. */
export const zoomScrollModule = {
  __init__: ['zoomScroll'],
  zoomScroll: ['type', ZoomScroll],
  __depends__: [zoomModule]
};
