import type EventEmitter from 'eventemitter3';
import { getLocalName } from '../utils/localName';
import type { DrawingSelection } from '../draw';
import type { ModellingModelElement } from '../modelling/types';

/** DOM mouse events re-broadcast on the bus for each drawn element. */
const MOUSE_EVENTS = [
  'mouseenter',
  'mouseover',
  'mousedown',
  'mouseup',
  'click',
  'dblclick',
  'mouseleave',
  'mouseout',
  'contextmenu'
] as const;

/**
 * Bridges raw DOM mouse events on drawn elements to typed bus events.
 *
 * For every created element it attaches listeners that re-emit as
 * `<localName>.<kind>` (e.g. `node.click`), carrying the element selection, its
 * definition, and the original DOM event. Ported from `core-v2beta`'s
 * `features/mouseEvents/MouseEvents.js` (updated to d3's event-argument
 * listener signature instead of the removed `d3.event` global).
 */
export class MouseEvents {
  static readonly $inject = ['eventBus'];

  private readonly _eventBus: EventEmitter;

  constructor(eventBus: EventEmitter) {
    this._eventBus = eventBus;
    this._init();
  }

  private _addListeners(
    element: DrawingSelection,
    definition: ModellingModelElement,
    className?: string
  ): void {
    const type = className ?? getLocalName(definition);
    MOUSE_EVENTS.forEach((kind) => {
      element.on(kind, (event: Event) => {
        this._eventBus.emit(`${type}.${kind}`, element, definition, event);
      });
    });
  }

  private _init(): void {
    (['label', 'link', 'node', 'zone'] as const).forEach((cls) => {
      this._eventBus.on(`${cls}.created`, this._addListeners, this);
    });
  }
}
