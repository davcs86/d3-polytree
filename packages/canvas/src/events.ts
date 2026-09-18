/* eslint-disable @typescript-eslint/no-explicit-any -- see EventSelection/EventModel */
import type { SvgSelection } from './types';

/**
 * The four drawable element classes. Mirrors core's `ElementClass`
 * (`@d3-polytree/core` `modelling/Modelling.ts`) structurally — declared here
 * because this map lives in `canvas`, the dependency sink, and canvas cannot
 * import upward from core.
 */
export type ElementClassName = 'node' | 'link' | 'label' | 'zone';

/** DOM pointer-event kinds re-broadcast on the bus. Mirrors `MOUSE_EVENTS` in
 * `@d3-polytree/core` `features/mouseEvents.ts`. */
export type MouseKind =
  | 'mouseenter'
  | 'mouseover'
  | 'mousedown'
  | 'mouseup'
  | 'click'
  | 'dblclick'
  | 'mouseleave'
  | 'mouseout'
  | 'contextmenu';

/**
 * The two "opaque" payload slots — a drawn element's `<g>` selection and its
 * moddle model element — are typed `any`, deliberately.
 *
 * These are core-owned types (`DrawingSelection = Selection<SVGGElement,
 * DiagramElement>`, `ModellingModelElement`) that `canvas` cannot import without
 * an upward dependency. Under `strictFunctionTypes`, eventemitter3's `on(event,
 * fn)` checks `fn`'s parameters **contravariantly**, so any canvas-nameable
 * supertype (`unknown`, a structural `RegisteredElement`) is rejected the moment
 * a subscriber annotates the real narrower type (`(el: DrawingSelection, def:
 * ModellingModelElement) => …`), and d3's `Selection` is additionally invariant
 * on its datum, so `DrawingSelection` is not even assignable to `Selection<…,
 * unknown>` at the emit site. `any` is the only type that satisfies both the
 * emit sites and the annotated subscribers across the package boundary.
 *
 * Consequence (design Open Risk #2): for the element/model-bearing events the
 * map guarantees the **event name and arity**, not the datum shape — precise
 * payload typing survives only on the canvas-expressible events below (`{svg}`,
 * primitives, `{dirty}`, `{canUndo,canRedo}`, string ids). That is exactly the
 * emit-site safety C12 targets; rich model access on the subscribe side is
 * delivered by each callback's own parameter annotation.
 */
type EventSelection = any;
type EventModel = any;

/** A selection snapshot entry. Structural mirror of core's `SelectionEntry`. */
interface EventSelectionEntry {
  element: EventSelection;
  definition: EventModel;
}

/** `<class>.created|updated|removed|moving` — drawer/drag notifications. */
type ElementLifecycleEvents = {
  [K in `${ElementClassName}.${'created' | 'updated' | 'removed' | 'moving'}`]: [
    EventSelection,
    EventModel
  ];
};

/** `<class>.<mouse kind>` (excluding click) — DOM pointer re-broadcast
 * (`mouseEvents.ts`), carrying the DOM `Event`. NOTE: emitted through a single
 * interpolated `emit(`${type}.${kind}`, …)`, so enforcement here is event-name
 * + arity (see design Open Risk #1). */
type ElementMouseEvents = {
  [K in `${ElementClassName}.${Exclude<MouseKind, 'click'>}`]: [EventSelection, EventModel, Event];
};

/** `<class>.click` — a DOM `Event` (mouseEvents) or `null` (SearchPanel re-emit);
 * different subscribers read `Event` or `{ ctrlKey?: boolean }`, so the 3rd slot
 * is `any`. */
type ElementClickEvents = {
  [K in `${ElementClassName}.click`]: [EventSelection, EventModel, any];
};

/** Events with fixed, literal names. */
interface LiteralEvents {
  'canvas.init': [{ svg: SvgSelection }];
  'canvas.destroy': [{ svg: SvgSelection }];
  'canvas.resized': [];
  'canvas.zoomed': [];
  'd3canvas.init': [];
  'd3canvas.destroy': [];
  'd3canvas.clear': [];
  'background.click': [];
  'label.deleted': [EventSelection, EventModel];
  'node.deleted': [EventSelection, EventModel];
  'link.deleted': [EventSelection, EventModel];
  'element.updated': [string, EventModel];
  'node.moved': [EventSelection, EventModel];
  'elements.delete': [Array<{ definition: EventModel }>];
  'selection.changed': [EventSelectionEntry[], EventSelectionEntry[]];
  'outline.created': [EventSelection, EventModel, EventSelection];
  'outline.updated': [EventSelection, EventModel, EventSelection];
  'zoom.preZoom': [number?, number?, number?];
  'zoom.start': [];
  'zoom.end': [];
  'zoom.init': [];
  'zoom.to.element': [EventSelection, EventModel];
  'commandStack.changed': [{ canUndo: boolean; canRedo: boolean }];
  'document.changed': [{ dirty: boolean }];
  'document.inconsistent': [unknown];
  'sidetab.registered': [unknown];
  'PropertiesPanel.propertyChanged': [string, EventModel];
}

/**
 * The typed contract for the shared `eventemitter3` bus. Consumed everywhere as
 * `EventEmitter<DiagramEventMap>`; keys are event names, values are the emit
 * argument tuples. Command names (`element.create|delete|resize|move`) are NOT
 * here — they route through `commandStack.execute`, a separate vocabulary.
 */
export type DiagramEventMap = ElementLifecycleEvents &
  ElementMouseEvents &
  ElementClickEvents &
  LiteralEvents;
