import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { BaseElement, DrawingRegistry } from '../draw';
import type { NotificationService } from '../features/notifications';
import type { PfdnModdle } from '@d3-polytree/pfdn-moddle';
import { ModellingElement } from './ModellingElement';
import type { CreateParameters, ModellingModelElement } from './types';
import { ElementStatus } from '../model/status';

/**
 * Modelling handler for labels.
 *
 * Ported from `core-v2beta`'s `features/modelling/elements/labels/Labels.js`.
 */
export class ModellingLabels extends ModellingElement {
  static readonly $inject = [
    'd3polytree.definitions',
    'd3polytree.moddle',
    'drawingRegistry',
    'notifications',
    'eventBus',
    'labels'
  ];

  private readonly _moddle: PfdnModdle;

  constructor(
    definitions: ModellingModelElement,
    moddle: PfdnModdle,
    drawingRegistry: DrawingRegistry,
    notifications: NotificationService,
    eventBus: EventEmitter<DiagramEventMap>,
    labels: BaseElement
  ) {
    super(definitions, labels, drawingRegistry, notifications, eventBus);
    this._moddle = moddle;
  }

  create(parameters: CreateParameters = {}): ModellingModelElement {
    const position = parameters.position ?? { x: 0, y: 0 };
    const positionDef = this._moddle.create('pfdn:Coordinates', { x: position.x, y: position.y });
    const labelDef = this._moddle.create('pfdn:Label', {
      position: positionDef,
      status: ElementStatus.Persisted
    }) as unknown as ModellingModelElement;

    this._drawer.reconcile(labelDef.id as string, labelDef);

    labelDef.text = labelDef.id;

    this._drawer.reconcile(labelDef.id as string, labelDef);
    return labelDef;
  }
}
