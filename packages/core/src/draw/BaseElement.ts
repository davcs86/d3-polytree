import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas, ElementBuilder, ElementRegistry } from '@d3-polytree/canvas';
import type { ElementClass } from '../modelling';
import type { DrawingRegistry } from './DrawingRegistry';
import type { ContainerSelection, DiagramElement, DrawingSelection } from './types';
import { ElementStatus } from '../model/status';

/**
 * Abstract base for a class of drawn diagram elements (nodes, links, labels, …).
 *
 * Owns a `<g>` container on the canvas drawing layer and reconciles a set of
 * model definitions into rendered `<g>` elements, emitting
 * `<className>.created|updated|removed` on the event bus. Concrete subclasses
 * implement {@link _createElement} and {@link _updateElement}.
 */
export abstract class BaseElement {
  protected readonly _className: ElementClass;
  protected readonly _canvas: Canvas;
  protected readonly _eventBus: EventEmitter<DiagramEventMap>;
  protected readonly _elementBuilder: ElementBuilder;
  protected readonly _elementRegistry: ElementRegistry;
  protected readonly _drawingRegistry: DrawingRegistry;

  protected readonly _elements = new Map<string, DiagramElement>();
  protected _elementsContainer: ContainerSelection | null = null;

  constructor(
    className: ElementClass,
    items: DiagramElement[] | undefined,
    canvas: Canvas,
    eventBus: EventEmitter<DiagramEventMap>,
    elementBuilder: ElementBuilder,
    elementRegistry: ElementRegistry,
    drawingRegistry: DrawingRegistry
  ) {
    this._className = className;
    this._canvas = canvas;
    this._eventBus = eventBus;
    this._elementBuilder = elementBuilder;
    this._elementRegistry = elementRegistry;
    this._drawingRegistry = drawingRegistry;
    this._init(items);
  }

  /** Render `definition` into `elem` (a fresh drawing group). */
  protected abstract _createElement(elem: DrawingSelection, definition: DiagramElement): void;

  /** Re-render `definition` into its existing `elem`. */
  protected abstract _updateElement(elem: DrawingSelection, definition: DiagramElement): void;

  /**
   * Public reconcile entry point for the modelling layer: create, update, or
   * remove the drawing for `definition` (remove when it is omitted).
   */
  reconcile(elementId: string, definition: DiagramElement | undefined): void {
    this._builder(elementId, definition);
  }

  /** Reconcile a single definition: create, update, or remove. */
  protected _builder(elementId: string, definition: DiagramElement | undefined): void {
    const element = this._elementRegistry.get(elementId);
    if (element && definition) {
      if (definition.get('status') !== ElementStatus.Persisted) {
        definition.set('status', ElementStatus.Dirty);
      }
      this.updateElement(definition);
    } else if (element && !definition) {
      this.removeElementById((element as DiagramElement).id as string);
    } else if (!element && definition) {
      this.appendElement(definition);
    }
  }

  protected _drawContainer(): void {
    if (this._elementsContainer) {
      this._elementsContainer.remove();
    }
    this._elementsContainer = this._canvas
      .getDrawingLayer()
      .append('g')
      .attr('class', `${this._className}-group`);
  }

  removeElement(definition: { id?: string }): void {
    const id = definition.id;
    if (typeof id !== 'string') {
      return;
    }
    this._elements.delete(id);
    const elem = this._drawingRegistry.get(id);
    if (elem) {
      this._drawingRegistry.remove(id);
      this._elementRegistry.removeElementById(id);
      this._eventBus.emit(`${this._className}.removed`, elem, definition);
      elem.remove();
    }
  }

  removeElementById(id: string): void {
    this.removeElement({ id });
  }

  /**
   * A short accessible name for `definition`, sourced only from the model (so it
   * is deterministic and available headless in SSR/`exportSVG`): the element
   * class plus its `name`/`text`/`type` when present, else the class alone.
   */
  protected _accessibleName(definition: DiagramElement): string {
    const name = definition.get('name');
    if (typeof name === 'string' && name) return `${this._className}: ${name}`;
    const text = definition.get('text');
    if (typeof text === 'string' && text) return `${this._className}: ${text}`;
    const type = definition.get('type');
    if (typeof type === 'string' && type) return `${this._className} (${type})`;
    return this._className;
  }

  appendElement(definition: DiagramElement): void {
    this._elementRegistry.claimId(definition, this._className);

    const newElem = this._elementsContainer!.append('g')
      .datum(definition)
      .attr('element-id', definition.id as string)
      .attr('class', `${this._className}Item element`);

    // Per-element accessible name (first children of the <g>) — read by assistive
    // tech, and carried into SSR/exportSVG output since it lives in the draw layer.
    newElem.append('title').text(this._accessibleName(definition));
    newElem.append('desc').text(definition.id as string);

    newElem.append('g').attr('class', 'innerElement').attr('transform', 'translate(3, 3)');

    this._createElement(newElem, definition);
    this._drawingRegistry.set(definition.id as string, newElem);
    this._elements.set(definition.id as string, definition);

    this._eventBus.emit(`${this._className}.created`, newElem, definition);
  }

  updateElement(definition: DiagramElement): void {
    const element = this._drawingRegistry.get(definition.id as string);
    if (!element) {
      return;
    }
    element.datum(definition);
    this._updateElement(element, definition);
    this._drawingRegistry.set(definition.id as string, element);
    this._elements.set(definition.id as string, definition);
    this._eventBus.emit(`${this._className}.updated`, element, definition);
  }

  getAll(): DiagramElement[] {
    return [...this._elements.values()];
  }

  getContainer(): ContainerSelection | null {
    return this._elementsContainer;
  }

  protected _init(items: DiagramElement[] | undefined): void {
    this._drawContainer();
    if (items) {
      items.forEach((definition) => this._builder(definition.id as string, definition));
    }
  }
}
