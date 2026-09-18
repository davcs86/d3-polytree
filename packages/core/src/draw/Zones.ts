import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas, ElementBuilder, ElementRegistry } from '@d3-polytree/canvas';
import { BaseElement } from './BaseElement';
import type { DrawingRegistry } from './DrawingRegistry';
import type { DiagramElement, DrawingSelection } from './types';
import type { ZoneDefinition } from './definitions';

/** Draws background zone rectangles (inserted behind other elements). */
export class Zones extends BaseElement {
  static readonly $inject = [
    'd3polytree.definitions.zone',
    'canvas',
    'eventBus',
    'elementBuilder',
    'elementRegistry',
    'drawingRegistry'
  ];

  constructor(
    zones: ZoneDefinition[] | undefined,
    canvas: Canvas,
    eventBus: EventEmitter<DiagramEventMap>,
    elementBuilder: ElementBuilder,
    elementRegistry: ElementRegistry,
    drawingRegistry: DrawingRegistry
  ) {
    super('zone', zones, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry);
  }

  protected _createElement(zone: DrawingSelection, definition: DiagramElement): void {
    const def = definition as ZoneDefinition;
    const { x, y } = def.position;

    zone.attr('x', x).attr('y', y).attr('transform', `translate(${x},${y})`);

    zone
      .append('rect')
      .attr('height', def.height ?? 0)
      .attr('width', def.width ?? 0)
      .style('stroke', def.border.lineColor ?? '')
      .style('fill', def.fillColor ?? '')
      .style('opacity', def.opacity ?? '')
      .style('stroke-width', def.border.lineWidth ?? '');
  }

  protected _updateElement(zone: DrawingSelection, definition: DiagramElement): void {
    const def = definition as ZoneDefinition;
    zone
      .select('rect')
      .attr('height', def.height ?? 0)
      .attr('width', def.width ?? 0)
      .style('stroke', def.border.lineColor ?? '')
      .style('fill', def.fillColor ?? '')
      .style('opacity', def.opacity ?? '')
      .style('stroke-width', def.border.lineWidth ?? '');
  }

  /** Zones render behind everything else, so insert the container first. */
  protected override _drawContainer(): void {
    if (this._elementsContainer) {
      this._elementsContainer.remove();
    }
    this._elementsContainer = this._canvas
      .getDrawingLayer()
      .insert('g', ':first-child')
      .attr('class', `${this._className}-group`);
  }
}
