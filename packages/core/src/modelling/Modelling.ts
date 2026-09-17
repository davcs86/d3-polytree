import type EventEmitter from 'eventemitter3';
import { getLocalName } from '../utils/localName';
import type { CommandStack } from '../command';
import { registerModellingCommands } from './commands';
import type { ModellingElement } from './ModellingElement';
import type { ModellingModelElement } from './types';

/** The four element classes the orchestrator routes events for. */
export type ElementClass = 'label' | 'node' | 'zone' | 'link';

/**
 * The actions dispatchable on an element handler: `saveToModel` / `delete` in
 * response to draw-layer events, and `create` for the palette add-handlers.
 */
export type MutatingAction = 'saveToModel' | 'delete' | 'create';

/**
 * Orchestrates the modelling layer: it listens for element lifecycle events on
 * the bus and routes each to the matching handler's model-mutating action, so
 * the draw layer stays the single source of lifecycle truth and the model
 * follows it.
 *
 * Ported from `core-v2beta`'s `features/modelling/Modelling.js`. The source's
 * `element.updated` handler reached into a handler's private drawer field
 * (`this._elements[name]['_'+name+'s']._builder(...)`); the port routes through
 * the handler's public {@link ModellingElement.reconcile} instead.
 */
export class Modelling {
  static readonly $inject = [
    'eventBus',
    'd3polytree.definitions',
    'modellingNodes',
    'modellingLabels',
    'modellingZones',
    'modellingLinks',
    'commandStack'
  ];

  private readonly _eventBus: EventEmitter;
  private readonly _elements: Record<ElementClass, ModellingElement>;
  private readonly _commandStack: CommandStack;

  constructor(
    eventBus: EventEmitter,
    definitions: ModellingModelElement,
    modellingNodes: ModellingElement,
    modellingLabels: ModellingElement,
    modellingZones: ModellingElement,
    modellingLinks: ModellingElement,
    commandStack: CommandStack
  ) {
    this._eventBus = eventBus;
    this._commandStack = commandStack;
    this._elements = {
      label: modellingLabels,
      node: modellingNodes,
      zone: modellingZones,
      link: modellingLinks
    };
    // The orchestrator is the command registration site: it owns the handler
    // map, so it wires each modelling command onto the stack.
    registerModellingCommands(commandStack, this._elements, definitions);
    this._init();
  }

  /** Invoke `action` on the handler for `elementClassName` with `parameters`. */
  doAction(elementClassName: string, action: MutatingAction, parameters: unknown[]): unknown {
    const handler = this._elements[elementClassName as ElementClass];
    if (handler) {
      const fn = handler[action] as
        | ((this: ModellingElement, ...args: unknown[]) => unknown)
        | undefined;
      if (fn) {
        return fn.apply(handler, parameters);
      }
    }
    return null;
  }

  private _init(): void {
    const route = (event: string, cls: ElementClass, action: MutatingAction): void => {
      this._eventBus.on(event, (...args: unknown[]) => this.doAction(cls, action, args));
    };

    route('label.created', 'label', 'saveToModel');
    route('link.created', 'link', 'saveToModel');
    route('node.created', 'node', 'saveToModel');
    route('zone.created', 'zone', 'saveToModel');

    route('label.deleted', 'label', 'delete');
    route('link.deleted', 'link', 'delete');
    route('node.deleted', 'node', 'delete');
    route('zone.deleted', 'zone', 'delete');

    this._eventBus.on(
      'element.updated',
      (elementId: string, elementDefinition: ModellingModelElement) => {
        const localName = getLocalName(elementDefinition);
        const handler = this._elements[localName as ElementClass];
        if (handler) {
          handler.reconcile(elementId, elementDefinition);
        }
      }
    );

    // A selection delete is a single transaction: the Selection feature emits
    // the intent (decoupled from the command stack, so it works in a viewer that
    // has no stack); the orchestrator — which owns the stack and handlers — turns
    // it into one composite `elements.delete` command.
    this._eventBus.on(
      'elements.delete',
      (snapshot: Array<{ definition: ModellingModelElement }>) => {
        this._commandStack.execute('elements.delete', {
          items: snapshot.map((v) => ({
            def: v.definition,
            className: getLocalName(v.definition) as ElementClass
          }))
        });
      }
    );
  }
}
