import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas, ElementBuilder, ElementRegistry } from '@d3-polytree/canvas';
import { BaseElement } from './BaseElement';
import type { DrawingRegistry } from './DrawingRegistry';
import type { DiagramElement, DrawingSelection } from './types';
import type { NodeDefinition } from './definitions';
import type { IconLoader } from './IconLoader';

/** Draws nodes as an icon (`<use>` of a symbol) at the node position. */
export class Nodes extends BaseElement {
  static readonly $inject = [
    'd3polytree.definitions.node',
    'canvas',
    'eventBus',
    'iconLoader',
    'elementBuilder',
    'elementRegistry',
    'drawingRegistry'
  ];

  private readonly _iconLoader: IconLoader;

  constructor(
    nodes: NodeDefinition[] | undefined,
    canvas: Canvas,
    eventBus: EventEmitter<DiagramEventMap>,
    iconLoader: IconLoader,
    elementBuilder: ElementBuilder,
    elementRegistry: ElementRegistry,
    drawingRegistry: DrawingRegistry
  ) {
    // Defer processing until `_iconLoader` is set (see Links for the rationale).
    super('node', undefined, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry);
    this._iconLoader = iconLoader;
    this._init(nodes);
  }

  protected _createElement(node: DrawingSelection, definition: DiagramElement): void {
    const def = definition as NodeDefinition;
    const type = def.type ?? 'default';
    const { x, y } = def.position;

    node.attr('x', x).attr('y', y).attr('transform', `translate(${x},${y})`);

    node
      .select('.innerElement')
      .append('svg')
      .attr('width', def.size ?? 0)
      .attr('height', def.size ?? 0)
      .attr('viewBox', this._iconLoader.getViewBox(type))
      .attr('preserveAspectRatio', 'xMaxYMax meet')
      .append('use')
      .attr('href', this._iconLoader.symbolHref(type));
  }

  protected _updateElement(node: DrawingSelection, definition: DiagramElement): void {
    const def = definition as NodeDefinition;
    const type = def.type ?? 'default';
    const { x, y } = def.position;

    node.attr('x', x).attr('y', y).attr('transform', `translate(${x},${y})`);

    node
      .select('.innerElement')
      .select('svg')
      .attr('width', def.size ?? 0)
      .attr('height', def.size ?? 0)
      .attr('viewBox', this._iconLoader.getViewBox(type))
      .select('use')
      .attr('href', this._iconLoader.symbolHref(type));
  }

  /** Nodes render above links but below labels: insert before the label group. */
  protected override _drawContainer(): void {
    if (this._elementsContainer) {
      this._elementsContainer.remove();
    }
    this._elementsContainer = this._canvas
      .getDrawingLayer()
      .insert('g', '.label-group')
      .attr('class', `${this._className}-group`);
  }
}
