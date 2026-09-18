import { drag as d3drag, type D3DragEvent } from 'd3-drag';
import { pointer, select, type Selection } from 'd3-selection';
import type EventEmitter from 'eventemitter3';
import type { Canvas } from '@d3-polytree/canvas';
import type { DrawingSelection, Point } from '../draw';
import type { CommandStack } from '../command';
import type { Geometry, ResizeContext } from '../modelling/commands';
import type { ModellingModelElement } from '../modelling/types';

type OutlineSelection = Selection<SVGGraphicsElement, unknown, null, undefined>;
type ContainerSelection = Selection<SVGGElement, unknown, null, undefined>;
type CornerSelection = Selection<SVGRectElement, unknown, null, undefined>;
type CornerDragEvent = D3DragEvent<SVGRectElement, unknown, unknown>;

/** Minimum node size when resizing. */
const MIN_SIZE = 16;
/** Half a corner handle (5px) plus the outline offset. */
const HANDLE_OFFSET = 2.5 + 3;
/** Outline padding around the node. */
const OUTLINE_PADDING = 6;

/**
 * Adds drag handles to node outlines so nodes can be resized.
 *
 * Ported from `core-v2beta`'s `features/resizeElement/ResizeElement.js`, moved
 * off `d3.mouse`/`d3.event` onto d3's `pointer(event, node)` and event-argument
 * drag listeners. Emits `element.updated` on release (the modelling
 * orchestrator reconciles the drawing).
 */
export class ResizeElement {
  static readonly $inject = ['eventBus', 'canvas', 'commandStack'];

  private readonly _eventBus: EventEmitter;
  private readonly _canvas: Canvas;
  private readonly _commandStack: CommandStack;

  constructor(eventBus: EventEmitter, canvas: Canvas, commandStack: CommandStack) {
    this._eventBus = eventBus;
    this._canvas = canvas;
    this._commandStack = commandStack;
    this._init();
  }

  /** Read a node's current geometry from the model (never from the DOM). */
  private _geometry(definition: ModellingModelElement): Geometry {
    const pos = definition.position as Point;
    return { size: Number(definition.size), position: { x: pos.x, y: pos.y } };
  }

  private _createCorners(
    element: DrawingSelection,
    definition: ModellingModelElement,
    outline: OutlineSelection
  ): void {
    const outlineSize = Number(outline.attr('width'));
    const container = select(outline.node()!.parentNode as Element)
      .append('g')
      .attr('class', 'resize-container') as unknown as ContainerSelection;

    const nwCorner = container.append('rect');
    const neCorner = corner(container, 'resize-drag-ne', outlineSize - 2.5, -2.5);
    const swCorner = corner(container, 'resize-drag-sw', -2.5, outlineSize - 2.5);
    const seCorner = corner(container, 'resize-drag-se', outlineSize - 2.5, outlineSize - 2.5);

    // Capture the pre-gesture geometry from the model at drag start (the live
    // drag overwrites it in place per tick, so `commit` cannot recover it), and
    // dispatch one undoable `element.resize` on release.
    let origin: Geometry | null = null;
    const start = (): void => {
      origin = this._geometry(definition);
    };
    const commit = (): void => {
      if (!origin) {
        return;
      }
      const ctx: ResizeContext = {
        def: definition,
        className: 'node',
        from: origin,
        to: this._geometry(definition)
      };
      this._commandStack.execute('element.resize', ctx);
      origin = null;
    };

    const setInnerSize = (size: number): void => {
      element.select('.innerElement').select('svg').attr('width', size).attr('height', size);
    };

    // top-right handle — measured against the SW corner
    this._setCornerToDrag(
      neCorner,
      (event) => {
        const pos = pointer(event, swCorner.node());
        const newSize = Math.max(MIN_SIZE, pos[0], pos[1] * -1.0) - HANDLE_OFFSET;
        const oldSize = Number(definition.size);
        setInnerSize(newSize);
        const newY = Number(element.attr('y')) + oldSize - newSize;
        const oldX = Number(element.attr('x'));
        element.attr('y', newY).attr('transform', `translate(${oldX},${newY})`);
        definition.size = newSize;
        (definition.position as Point).y = newY;
        this._updateOutlineAndCorners(outline, container, newSize + OUTLINE_PADDING);
      },
      commit,
      start
    );

    // bottom-left handle — measured against the NE corner
    this._setCornerToDrag(
      swCorner,
      (event) => {
        const pos = pointer(event, neCorner.node());
        const newSize = Math.max(MIN_SIZE, pos[0] * -1.0, pos[1]) - HANDLE_OFFSET;
        const oldSize = Number(definition.size);
        setInnerSize(newSize);
        const newX = Number(element.attr('x')) + oldSize - newSize;
        const oldY = Number(element.attr('y'));
        element.attr('x', newX).attr('transform', `translate(${newX},${oldY})`);
        definition.size = newSize;
        (definition.position as Point).x = newX;
        this._updateOutlineAndCorners(outline, container, newSize + OUTLINE_PADDING);
      },
      commit,
      start
    );

    // bottom-right handle — measured against the NW corner
    this._setCornerToDrag(
      seCorner,
      (event) => {
        const pos = pointer(event, nwCorner.node());
        const newSize = Math.max(MIN_SIZE, pos[0], pos[1]) - HANDLE_OFFSET;
        definition.size = newSize;
        setInnerSize(newSize);
        this._updateOutlineAndCorners(outline, container, newSize + OUTLINE_PADDING);
      },
      commit,
      start
    );
  }

  private _updateOutlineAndCorners(
    outline: OutlineSelection,
    container: ContainerSelection,
    newOutlineSize: number
  ): void {
    outline.attr('width', newOutlineSize).attr('height', newOutlineSize);
    container.select('.resize-drag-ne').attr('x', newOutlineSize - 2.5);
    container.select('.resize-drag-sw').attr('y', newOutlineSize - 2.5);
    container
      .select('.resize-drag-se')
      .attr('x', newOutlineSize - 2.5)
      .attr('y', newOutlineSize - 2.5);
  }

  private _setCornerToDrag(
    corner: CornerSelection,
    draggedFn: (event: CornerDragEvent) => void,
    commitFn: () => void,
    startFn: () => void
  ): void {
    corner.call(
      d3drag<SVGRectElement, unknown>().on('start', (event: CornerDragEvent) => {
        if (!this._canvas.getRootLayer().classed('no-drag')) {
          startFn();
          event.on('drag', draggedFn).on('end', commitFn);
        }
      })
    );
  }

  private _init(): void {
    this._eventBus.on(
      'outline.created',
      (element: DrawingSelection, definition: ModellingModelElement, outline: OutlineSelection) => {
        if (definition.$instanceOf('pfdn:Node')) {
          this._createCorners(element, definition, outline);
        }
      }
    );
    this._eventBus.on(
      'outline.updated',
      (element: DrawingSelection, definition: ModellingModelElement, outline: OutlineSelection) => {
        if (definition.$instanceOf('pfdn:Node')) {
          const container = element.select('.resize-container') as unknown as ContainerSelection;
          this._updateOutlineAndCorners(
            outline,
            container,
            OUTLINE_PADDING + Number(definition.size)
          );
        }
      }
    );
  }
}

/** Append a 5×5 corner handle rect at (x, y). */
function corner(
  container: ContainerSelection,
  className: string,
  x: number,
  y: number
): CornerSelection {
  return container
    .append('rect')
    .attr('fill', 'none')
    .attr('x', x)
    .attr('y', y)
    .attr('width', 5)
    .attr('height', 5)
    .attr('class', className);
}
