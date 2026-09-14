import type EventEmitter from 'eventemitter3';
import type { BaseElement, DrawingRegistry } from '../draw';
import type { NotificationService } from '../features/notifications';
import { ModellingElement } from './ModellingElement';
import type { ModellingModelElement } from './types';

/**
 * Modelling handler for zones.
 *
 * The create flow is a placeholder in the source engine; parity is preserved
 * here. Ported from `core-v2beta`'s
 * `features/modelling/elements/zones/Zones.js`.
 */
export class ModellingZones extends ModellingElement {
  static readonly $inject = [
    'd3polytree.definitions',
    'drawingRegistry',
    'notifications',
    'eventBus',
    'zones'
  ];

  constructor(
    definitions: ModellingModelElement,
    drawingRegistry: DrawingRegistry,
    notifications: NotificationService,
    eventBus: EventEmitter,
    zones: BaseElement
  ) {
    super(definitions, zones, drawingRegistry, notifications, eventBus);
  }

  create(): ModellingModelElement | null {
    // Not yet implemented in the source engine.
    return null;
  }
}
