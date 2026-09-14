import { MouseEvents } from './mouseEvents';
import { Selection } from './selection';
import { Zoom } from './zoom';
import { ZoomScroll } from './zoomScroll';
import { BackgroundColor } from './backgroundColor';
import { Axes } from './axes';
import { Outline } from './outline';
import { calculateCenterModule } from '../utils/calculateCenter';

export * from './notifications';
export { MouseEvents } from './mouseEvents';
export { Selection } from './selection';
export type { SelectionEntry } from './selection';
export { Zoom } from './zoom';
export { ZoomScroll } from './zoomScroll';
export { BackgroundColor } from './backgroundColor';
export { Axes } from './axes';
export { Outline } from './outline';

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

/** didi module painting the canvas background from settings. */
export const backgroundColorModule = {
  __init__: ['backgroundColor'],
  backgroundColor: ['type', BackgroundColor]
};

/** didi module drawing the background grid, aligned to the zoom transform. */
export const axesModule = {
  __init__: ['axes'],
  axes: ['type', Axes],
  __depends__: [zoomModule]
};

/** didi module adding a selection outline to every drawn element. */
export const outlineModule = {
  __init__: ['outline'],
  outline: ['type', Outline]
};
