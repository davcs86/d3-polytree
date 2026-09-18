import type { GroupSelection, RegisteredElement, SvgSelection } from './types';

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
 * A model element as seen through the bus. This is the canvas-visible surface
 * of core's `ModellingModelElement` / `DiagramElement` — deliberately the
 * structural `RegisteredElement` (`{ id?; [key: string]: unknown }`), NOT a
 * hand-maintained shadow: canvas cannot import core's model types without an
 * upward dependency. Rich model precision on the *subscribe* side (typed
 * `.position`, `.waypoint`, …) is delivered by each callback's own parameter
 * annotation, which eventemitter3's bivariant `on` listener typing permits — it
 * is NOT promised by this map. The map's honest guarantee is emit-site key +
 * arity + primitive-payload checking.
 */
type EventModel = RegisteredElement;

/** A selection snapshot entry. Structural mirror of core's `SelectionEntry`. */
interface EventSelectionEntry {
  element: GroupSelection;
  definition: EventModel;
}

/** `<class>.created|updated|removed|moving` — drawer/drag notifications. */
type ElementLifecycleEvents = {
  [K in `${ElementClassName}.${'created' | 'updated' | 'removed' | 'moving'}`]: [
    GroupSelection,
    EventModel
  ];
};

/**
 * `<class>.<mouse kind>` — DOM pointer re-broadcast (`mouseEvents.ts`). NOTE:
 * these keys are emitted through a single interpolated `emit(`${type}.${kind}`,
 * …)`, so the divergent `.click` payload below is NOT strictly enforced at that
 * emit (the args need only match one constituent of the key union); enforcement
 * bites at literal-key emits and on the subscribe side. See design Open Risk #1.
 */
type ElementMouseEvents = {
  [K in `${ElementClassName}.${Exclude<MouseKind, 'click'>}`]: [
    GroupSelection,
    EventModel,
    Event
  ];
};

/** `<class>.click` — a DOM `Event` (mouseEvents) or `null` (SearchPanel re-emit);
 * subscribers read `{ ctrlKey?: boolean }`. Reconciled to one payload. */
type ElementClickEvents = {
  [K in `${ElementClassName}.click`]: [
    GroupSelection,
    EventModel,
    { ctrlKey?: boolean } | null
  ];
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
  'label.deleted': [GroupSelection, EventModel];
  'node.deleted': [GroupSelection, EventModel];
  'link.deleted': [GroupSelection, EventModel];
  'element.updated': [string, EventModel];
  'node.moved': [GroupSelection, EventModel];
  'elements.delete': [Array<{ definition: EventModel }>];
  'selection.changed': [EventSelectionEntry[], EventSelectionEntry[]];
  'outline.created': [GroupSelection, EventModel, GroupSelection];
  'outline.updated': [GroupSelection, EventModel, GroupSelection];
  'zoom.preZoom': [number, number, number];
  'zoom.start': [];
  'zoom.end': [];
  'zoom.init': [];
  'zoom.to.element': [GroupSelection, EventModel];
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
