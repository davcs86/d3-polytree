import type EventEmitter from 'eventemitter3';
import type { BaseElement, DrawingRegistry, Point } from '../draw';
import type { NotificationService } from '../features/notifications';
import type { PfdnModdle } from '@d3-polytree/pfdn-moddle';
import { ModellingElement } from './ModellingElement';
import type { ModellingLabels } from './Labels';
import type { CreateParameters, ModellingModelElement } from './types';

/** Vertical gap between a node's baseline and its associated label. */
const NODE_LABEL_GAP = 15;

/**
 * Modelling handler for nodes.
 *
 * Creating a node also creates a read-only associated label positioned beneath
 * it. Ported from `core-v2beta`'s
 * `features/modelling/elements/nodes/Nodes.js`.
 */
export class ModellingNodes extends ModellingElement {
  static readonly $inject = [
    'd3polytree.definitions',
    'd3polytree.moddle',
    'drawingRegistry',
    'notifications',
    'eventBus',
    'nodes',
    'modellingLabels'
  ];

  private readonly _moddle: PfdnModdle;
  private readonly _modellingLabels: ModellingLabels;

  constructor(
    definitions: ModellingModelElement,
    moddle: PfdnModdle,
    drawingRegistry: DrawingRegistry,
    notifications: NotificationService,
    eventBus: EventEmitter,
    nodes: BaseElement,
    modellingLabels: ModellingLabels
  ) {
    super(definitions, nodes, drawingRegistry, notifications, eventBus);
    this._moddle = moddle;
    this._modellingLabels = modellingLabels;
  }

  create(parameters: CreateParameters = {}): ModellingModelElement {
    const type = parameters.type ?? 'default';
    const position = parameters.position ?? { x: 0, y: 0 };
    const positionDef = this._moddle.create('pfdn:Coordinates', { x: position.x, y: position.y });
    const nodeDef = this._moddle.create('pfdn:Node', {
      type,
      position: positionDef,
      status: 1
    }) as unknown as ModellingModelElement;

    this._drawer.reconcile(nodeDef.id as string, nodeDef);

    const nodePosition = nodeDef.position as Point;
    const nodeSize = nodeDef.size ?? 0;

    // create the associated label beneath the node
    const nodeLabel = this._modellingLabels.create({
      position: {
        x: nodePosition.x,
        y: nodePosition.y + nodeSize + NODE_LABEL_GAP
      }
    });
    nodeLabel.text = nodeDef.id;
    nodeLabel.isReadOnly = true;
    nodeDef.label = nodeLabel;

    this._modellingLabels.reconcile(nodeLabel.id as string, nodeLabel);
    return nodeDef;
  }
}
