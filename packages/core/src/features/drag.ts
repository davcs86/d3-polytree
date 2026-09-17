import { drag as d3drag, type D3DragEvent } from 'd3-drag';
import type EventEmitter from 'eventemitter3';
import type { Canvas } from '@d3-polytree/canvas';
import { getLocalName } from '../utils/localName';
import type { DrawingRegistry, DrawingSelection, DiagramElement, Point } from '../draw';
import type { CommandStack } from '../command';
import type { ElementClass } from '../modelling';
import type { MoveItem, Placement } from '../modelling/commands';
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
  static readonly $inject = ['canvas', 'eventBus', 'drawingRegistry', 'selection', 'commandStack'];

  private readonly _canvas: Canvas;
  private readonly _eventBus: EventEmitter;
  private readonly _drawingRegistry: DrawingRegistry;
  private readonly _selection: Selection;
  private readonly _commandStack: CommandStack;
  /** The pre-gesture placement of each moved element, captured at drag start. */
  private _origin: Array<{ item: MoveItem }> = [];

  constructor(
    canvas: Canvas,
    eventBus: EventEmitter,
    drawingRegistry: DrawingRegistry,
    selection: Selection,
    commandStack: CommandStack
  ) {
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._drawingRegistry = drawingRegistry;
    this._selection = selection;
    this._commandStack = commandStack;
    this._init();
  }

  /** Read an element's current placement from the model (never the DOM). */
  private _placement(def: ModellingModelElement): Placement {
    const pos = def.position as Point;
    return { position: { x: pos.x, y: pos.y }, status: Number(def.get('status') ?? 0) };
  }

  /**
   * Snapshot the placement of every selected non-link element (and its label)
   * at drag start — the live drag overwrites the model in place, so this is the
   * only chance to record the "from" state for an undoable move.
   */
  captureMoveOrigin(): void {
    this._origin = this._selection
      .getSelectedElements()
      .filter((v) => getLocalName(v.definition) !== 'link')
      .map((v) => {
        const label = v.definition.label as ModellingModelElement | undefined;
        const from = this._placement(v.definition);
        return {
          item: {
            def: v.definition,
            className: getLocalName(v.definition) as ElementClass,
            from,
            to: from,
            label: label
              ? { def: label, from: this._placement(label), to: this._placement(label) }
              : undefined
          } satisfies MoveItem
        };
      });
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

  /**
   * Commit the drag: dispatch one batched, undoable `element.move` carrying the
   * captured origin (`from`) and the current model state (`to`). The command
   * reconciles each moved node, whose `node.updated` re-drives the link router —
   * so waypoints are recomputed, never stored. Links were excluded at capture.
   */
  notifyMovedSelected(): void {
    if (this._origin.length === 0) {
      return;
    }
    const items: MoveItem[] = this._origin.map(({ item }) => ({
      ...item,
      to: this._placement(item.def),
      label: item.label
        ? { def: item.label.def, from: item.label.from, to: this._placement(item.label.def) }
        : undefined
    }));
    this._origin = [];
    this._commandStack.execute('element.move', { items });
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
          this.captureMoveOrigin();
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
