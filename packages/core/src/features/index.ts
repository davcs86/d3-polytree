import { MouseEvents } from './mouseEvents';
import { Selection } from './selection';

export * from './notifications';
export { MouseEvents } from './mouseEvents';
export { Selection } from './selection';
export type { SelectionEntry } from './selection';

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
