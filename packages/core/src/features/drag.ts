import { drag as d3drag, type D3DragEvent } from 'd3-drag';
import type EventEmitter from 'eventemitter3';
import type { Canvas } from '@d3-polytree/canvas';
import { getLocalName } from '../utils/localName';
import type { DrawingRegistry, DrawingSelection, DiagramElement, Point } from '../draw';
import type { ModellingModelElement } from '../modelling/types';
import type { Selection } from './selection';

type DragEvent = D3DragEvent<SVGGElement, DiagramElement, DiagramElement>;

/**
 * Dragging of outlined elements.
 *
 * Attaches `d3-drag` to each outlined (non-link) element; dragging moves the
 * whole selection (and each element's associated label), emitting `<class>.moving`
 * live and `<class>.moved` on release — the latter is what the modelling link
 * router re-routes on. Ported from `core-v2beta`'s `features/drag/Drag.js`,
 * moved off the removed `d3.event` global onto d3's event-argument listeners.
 *
 * The offset/commit steps are public so the drag can be driven programmatically
 * and unit-tested without synthesising pointer gestures.
 */
export class Drag {
  static readonly $inject = ['canvas', 'eventBus', 'drawingRegistry', 'selection'];

  private readonly _canvas: Canvas;
  private readonly _eventBus: EventEmitter;
  private readonly _drawingRegistry: DrawingRegistry;
  private readonly _selection: Selection;

  constructor(
    canvas: Canvas,
    eventBus: EventEmitter,
    drawingRegistry: DrawingRegistry,
    selection: Selection
  ) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._drawingRegistry = drawingRegistry;
    this._selection = selection;
    this._init();
  }

  /** Move every selected non-link element (and its label) by (dx, dy). */
  applyOffsetToSelected(dx: number, dy: number): void {
    this._selection.getSelectedElements().forEach((v) => {
      if (getLocalName(v.definition) === 'link') {
        return;
      }
      this._applyOffset(v.element, v.definition, dx, dy);
      const label = v.definition.label as ModellingModelElement | undefined;
      if (label) {
        const labelElem = this._drawingRegistry.get(label.id as string);
        if (labelElem) {
          this._applyOffset(labelElem, label, dx, dy);
        }
      }
    });
  }

  /** Emit `<class>.moved` for every selected non-link element. */
  notifyMovedSelected(): void {
    this._selection.getSelectedElements().forEach((v) => {
      if (getLocalName(v.definition) !== 'link') {
        this._eventBus.emit(`${getLocalName(v.definition)}.moved`, v.element, v.definition);
      }
    });
  }

  private _applyOffset(
    elem: DrawingSelection,
    def: ModellingModelElement,
    dx: number,
    dy: number
  ): void {
    const x = Number(elem.attr('x')) + dx;
    const y = Number(elem.attr('y')) + dy;
    elem.attr('x', x).attr('y', y).attr('transform', `translate(${x},${y})`);

    const position = def.position as Point;
    position.x = x;
    position.y = y;

    if (def.get('status') !== 1) {
      def.set('status', 2);
    }
    this._eventBus.emit(`${getLocalName(def)}.moving`, elem, def);
  }

  private _setElemToDrag(element: DrawingSelection, definition: ModellingModelElement): void {
    element.call(
      d3drag<SVGGElement, DiagramElement>().on('start', (event: DragEvent) => {
        this._selection.select(element, definition, event.sourceEvent as { ctrlKey?: boolean });
        if (!this._canvas.getRootLayer().classed('no-drag')) {
          event
            .on('drag', (e: DragEvent) => this.applyOffsetToSelected(e.dx, e.dy))
            .on('end', () => this.notifyMovedSelected());
        }
      })
    );
  }

  private _init(): void {
    this._eventBus.on(
      'outline.created',
      (element: DrawingSelection, definition: ModellingModelElement) => {
        if (getLocalName(definition) !== 'link') {
          this._setElemToDrag(element, definition);
        }
      }
    );
  }
}
