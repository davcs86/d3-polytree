import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas, ElementBuilder, ElementRegistry } from '@d3-polytree/canvas';
import { BaseElement } from './BaseElement';
import type { DrawingRegistry } from './DrawingRegistry';
import type { DiagramElement, DrawingSelection } from './types';
import type { LinkDefinition, Point } from './definitions';
import type { Markers } from './Markers';

function generateWayPointPath(waypoints: Point[]): string {
  return `M ${waypoints.map((p) => `${p.x} ${p.y}`).join(', L ')}`;
}

/** Draws links as poly-line paths with an arrowhead marker. */
export class Links extends BaseElement {
  static readonly $inject = [
    'd3polytree.definitions.link',
    'canvas',
    'eventBus',
    'markers',
    'elementBuilder',
    'elementRegistry',
    'drawingRegistry'
  ];

  private readonly _markers: Markers;

  constructor(
    links: LinkDefinition[] | undefined,
    canvas: Canvas,
    eventBus: EventEmitter<DiagramEventMap>,
    markers: Markers,
    elementBuilder: ElementBuilder,
    elementRegistry: ElementRegistry,
    drawingRegistry: DrawingRegistry
  ) {
    // Defer item processing until `_markers` is assigned: BaseElement's
    // constructor would otherwise run _createElement (which needs markers)
    // before this subclass field is set.
    super('link', undefined, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry);
    this._markers = markers;
    this._init(links);
  }

  protected _createElement(link: DrawingSelection, definition: DiagramElement): void {
    const def = definition as LinkDefinition;
    const wPath = generateWayPointPath(def.waypoint);
    const inner = link.select('.innerElement');

    inner
      .append('path')
      .attr('class', 'line-path')
      .attr(
        'marker-end',
        `url(#${this._markers.getMarker(def.id as string, def.lineColor, def.fillColor)})`
      )
      .attr('d', wPath)
      .style('stroke', def.lineColor ?? '')
      .style('fill', 'none')
      .style('stroke-width', `${def.lineWidth ?? 0}px`)
      .attr('stroke-linejoin', 'round')
      .style('stroke-linecap', 'round');

    inner
      .append('path')
      .attr('class', 'line-subpath')
      .attr('d', wPath)
      .style('stroke', def.fillColor ?? '')
      .style('fill', 'none')
      .style('stroke-width', `${0.375 * (def.lineWidth ?? 0)}px`)
      .attr('stroke-linejoin', 'round')
      .style('stroke-linecap', 'round');
  }

  protected _updateElement(link: DrawingSelection, definition: DiagramElement): void {
    const def = definition as LinkDefinition;
    const wPath = generateWayPointPath(def.waypoint);
    const inner = link.select('.innerElement');

    inner
      .select('.line-path')
      .attr(
        'marker-end',
        `url(#${this._markers.getMarker(def.id as string, def.lineColor, def.fillColor)})`
      )
      .attr('d', wPath)
      .style('stroke', def.lineColor ?? '')
      .style('stroke-width', `${def.lineWidth ?? 0}px`);

    inner
      .select('.line-subpath')
      .attr('d', wPath)
      .style('stroke', def.fillColor ?? '')
      .style('stroke-width', `${0.375 * (def.lineWidth ?? 0)}px`);
  }

  /** Links render behind nodes: insert before the node group when present. */
  protected override _drawContainer(): void {
    if (this._elementsContainer) {
      this._elementsContainer.remove();
    }
    this._elementsContainer = this._canvas
      .getDrawingLayer()
      .insert('g', '.node-group')
      .attr('class', `${this._className}-group`);
  }
}
