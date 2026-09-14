import type EventEmitter from 'eventemitter3';
import { getLocalName } from '../utils/localName';
import type { DrawingSelection } from '../draw';
import type { Point } from '../draw';
import type { ModellingModelElement } from '../modelling/types';

/** The bounding box an outline rect is sized from. */
interface OutlineBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Padding added around a computed box to form the outline rect. */
const OUTLINE_PADDING = 6;

/**
 * Adds a dashed selection outline (`.element-outline` rect) to every drawn
 * element and keeps it sized to the element. Emits `outline.created` /
 * `outline.updated` (consumed by the drag feature). Ported from
 * `core-v2beta`'s `features/outline/Outline.js`.
 */
export class Outline {
  static readonly $inject = ['eventBus'];

  private readonly _eventBus: EventEmitter;

  constructor(eventBus: EventEmitter) {
    this._eventBus = eventBus;
    this._init();
  }

  private _computeBox(element: DrawingSelection, definition: ModellingModelElement): OutlineBox {
    const type = getLocalName(definition);
    if (type === 'link') {
      const waypoint = (definition.waypoint as Point[] | undefined) ?? [];
      if (waypoint.length > 0) {
        const p1 = waypoint[0];
        const p2 = waypoint[waypoint.length - 1];
        return {
          x: Math.min(p1.x, p2.x),
          y: Math.min(p1.y, p2.y),
          width: Math.abs(p2.x - p1.x),
          height: Math.abs(p2.y - p1.y)
        };
      }
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    if (type === 'node') {
      const size = Number(definition.size ?? 0);
      return { x: 0, y: 0, width: size, height: size };
    }
    // labels / zones: measure the rendered inner element
    const inner = element.select<SVGGElement>('.innerElement').node();
    const bbox = inner ? inner.getBBox() : { x: 0, y: 0, width: 0, height: 0 };
    return { x: 0, y: 0, width: bbox.width, height: bbox.height };
  }

  private _createOutline(element: DrawingSelection, definition: ModellingModelElement): void {
    const box = this._computeBox(element, definition);
    const outline = element
      .insert('rect', ':first-child')
      .attr('class', 'element-outline')
      .attr('x', box.x)
      .attr('y', box.y)
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 0)
      .attr('stroke-dasharray', '3')
      .attr('width', box.width + OUTLINE_PADDING)
      .attr('height', box.height + OUTLINE_PADDING);
    this._eventBus.emit('outline.created', element, definition, outline);
  }

  private _updateOutline(element: DrawingSelection, definition: ModellingModelElement): void {
    const box = this._computeBox(element, definition);
    const outline = element
      .select('.element-outline')
      .attr('x', box.x)
      .attr('y', box.y)
      .attr('width', box.width + OUTLINE_PADDING)
      .attr('height', box.height + OUTLINE_PADDING);
    this._eventBus.emit('outline.updated', element, definition, outline);
  }

  private _init(): void {
    (['node', 'label', 'zone', 'link'] as const).forEach((cls) => {
      this._eventBus.on(`${cls}.created`, this._createOutline, this);
      this._eventBus.on(`${cls}.updated`, this._updateOutline, this);
    });
  }
}
