import type EventEmitter from 'eventemitter3';
import type { Canvas, ElementBuilder, ElementRegistry } from '@d3-polytree/canvas';
import { BaseElement } from './BaseElement';
import type { DrawingRegistry } from './DrawingRegistry';
import type { DiagramElement, DrawingSelection } from './types';
import type { LabelDefinition } from './definitions';

const LABEL_FONT =
  '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, ' +
  '"Lucida Grande", sans-serif';

/** Draws floating text labels. */
export class Labels extends BaseElement {
  static readonly $inject = [
    'd3polytree.definitions.label',
    'canvas',
    'eventBus',
    'elementBuilder',
    'elementRegistry',
    'drawingRegistry'
  ];

  constructor(
    labels: LabelDefinition[] | undefined,
    canvas: Canvas,
    eventBus: EventEmitter,
    elementBuilder: ElementBuilder,
    elementRegistry: ElementRegistry,
    drawingRegistry: DrawingRegistry
  ) {
    super('label', labels, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry);
  }

  protected _createElement(label: DrawingSelection, definition: DiagramElement): void {
    const def = definition as LabelDefinition;
    const { x, y } = def.position;

    label.attr('x', x).attr('y', y).attr('transform', `translate(${x},${y})`);

    label
      .select('.innerElement')
      .attr('transform', 'translate(3.66,3.66)')
      .append('text')
      .style('font-family', LABEL_FONT)
      .attr('dominant-baseline', 'hanging')
      .attr('fill', def.color ?? null)
      .style('font-size', `${def.fontSize}px`)
      .text(def.text ?? '');
  }

  protected _updateElement(label: DrawingSelection, definition: DiagramElement): void {
    const def = definition as LabelDefinition;
    const { x, y } = def.position;

    label.attr('x', x).attr('y', y).attr('transform', `translate(${x},${y})`);

    label
      .select('.innerElement')
      .select('text')
      .attr('fill', def.color ?? null)
      .style('font-size', `${def.fontSize}px`)
      .text(def.text ?? '');
  }
}
