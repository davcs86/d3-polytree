import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { BaseElement } from '../draw';
import type { DrawingRegistry } from '../draw';
import type { NotificationService } from '../features/notifications';
import { getLocalName } from '../utils/localName';
import * as collections from '../utils/collections';
import type { ModellingModelElement } from './types';

/**
 * Abstract base for the modelling element handlers (nodes, labels, zones,
 * links, …).
 *
 * Each handler owns the model-mutating side of one element class: it creates
 * fresh model elements, persists them into the diagram's definition
 * collections, and tears them down. The rendering side lives in the matching
 * draw-layer {@link BaseElement}; a handler reconciles the drawing through that
 * drawer's public {@link BaseElement.reconcile} entry point.
 *
 * Ported from `core-v2beta`'s `features/modelling/elements/base/Base.js`.
 */
export abstract class ModellingElement {
  protected readonly _definitions: ModellingModelElement;
  protected readonly _drawer: BaseElement;
  protected readonly _drawingRegistry: DrawingRegistry;
  protected readonly _notifications: NotificationService;
  protected readonly _eventBus: EventEmitter<DiagramEventMap>;

  constructor(
    definitions: ModellingModelElement,
    drawer: BaseElement,
    drawingRegistry: DrawingRegistry,
    notifications: NotificationService,
    eventBus: EventEmitter<DiagramEventMap>
  ) {
    this._definitions = definitions;
    this._drawer = drawer;
    this._drawingRegistry = drawingRegistry;
    this._notifications = notifications;
    this._eventBus = eventBus;
  }

  /** Build (and render) a new model element. Subclasses implement the shape. */
  abstract create(...args: unknown[]): ModellingModelElement | null;

  /** Reconcile a definition through this handler's drawer. */
  reconcile(elementId: string, definition: ModellingModelElement | undefined): void {
    this._drawer.reconcile(elementId, definition);
  }

  /** Persist a created element into the diagram's matching definition list. */
  saveToModel(_element: unknown, definition: ModellingModelElement): void {
    const localName = getLocalName(definition);
    collections.add(
      this._definitions.get(localName) as ModellingModelElement[] | undefined,
      definition
    );
  }

  /**
   * Remove an element from the diagram. Refuses to delete an associated label
   * on its own; when a non-label carries an associated label, that label is
   * released and its deletion cascaded through the event bus.
   */
  delete(_element: unknown, definition: ModellingModelElement): void {
    const localName = getLocalName(definition);
    if (localName === 'label' && definition.isReadOnly === true) {
      this._notifications.error({
        title: 'Not allowed!',
        text: "You can't delete an associated label, you should remove the main element"
      });
      return;
    }

    const label = definition.get('label') as ModellingModelElement | undefined;
    if (localName !== 'label' && label && label.$instanceOf('pfdn:Label')) {
      // cascade: release and delete the associated label
      label.isReadOnly = false;
      const lblElement = this._drawingRegistry.get(label.id as string);
      this._eventBus.emit('label.deleted', lblElement, label);
    }

    definition.set('status', 3);
    this._drawer.reconcile(definition.id as string, undefined);
  }
}
