import type { CommandContext, CommandHandler, CommandStack } from '../command';
import * as collections from '../utils/collections';
import { getLocalName } from '../utils/localName';
import type { ModellingElement } from './ModellingElement';
import type { ElementClass } from './Modelling';
import type { ModellingModelElement } from './types';

/**
 * The command handlers that carry every model mutation, and their registration.
 *
 * Each handler's `execute`/`revert` reuses the existing modelling primitives
 * (the per-class {@link ModellingElement} handlers, `collections.add/remove`,
 * the soft-delete `status` flag) — the command layer adds the transaction and
 * the inverse, it does not re-implement the mutation. Contexts are the memento:
 * ids and plain model-prop values only (decision O13).
 */

/** The four element-class handlers, keyed as the orchestrator keys them. */
export type ElementHandlers = Record<ElementClass, ModellingElement>;

/** `element.create` — mint (or, on redo, re-attach) an element and persist it. */
export interface CreateContext extends CommandContext {
  className: ElementClass;
  parameters: unknown[];
  /** Set by `execute`; the created element (its memento for revert/redo). */
  created?: ModellingModelElement;
}

function persist(definitions: ModellingModelElement, def: ModellingModelElement): void {
  const localName = getLocalName(def);
  collections.add(definitions.get(localName) as ModellingModelElement[] | undefined, def);
}

function unpersist(
  definitions: ModellingModelElement,
  handler: ModellingElement,
  def: ModellingModelElement
): void {
  const localName = getLocalName(def);
  collections.remove(definitions.get(localName) as ModellingModelElement[] | undefined, def);
  handler.reconcile(def.id as string, undefined);
}

/** Build the `element.create` command handler. */
export function createElementCommand(
  handlers: ElementHandlers,
  definitions: ModellingModelElement,
  labelHandler: ModellingElement
): CommandHandler<CreateContext> {
  return {
    execute(ctx) {
      const handler = handlers[ctx.className];
      let created = ctx.created;
      if (!created) {
        // first run: mint the element (renders itself, and its label if any)
        created = handler.create(...ctx.parameters) as ModellingModelElement;
        ctx.created = created;
      } else {
        // redo: re-render the same element (and its associated label)
        handler.reconcile(created.id as string, created);
        if (created.label) {
          labelHandler.reconcile(created.label.id as string, created.label);
        }
      }
      // Persist explicitly — after the reroute lands (Step 8) the draw-layer
      // `.created` event no longer saves, so the command owns persistence.
      // `collections.add` is idempotent, so this is safe during the transition.
      persist(definitions, created);
      if (created.label) {
        persist(definitions, created.label);
      }
    },
    revert(ctx) {
      const created = ctx.created;
      if (!created) {
        return;
      }
      if (created.label) {
        unpersist(definitions, labelHandler, created.label);
      }
      unpersist(definitions, handlers[ctx.className], created);
    }
  };
}

/**
 * Register every implemented modelling command on the stack. Called by the
 * {@link Modelling} orchestrator (the registration site) at construction.
 */
export function registerModellingCommands(
  commandStack: CommandStack,
  handlers: ElementHandlers,
  definitions: ModellingModelElement
): void {
  commandStack.registerHandler(
    'element.create',
    createElementCommand(handlers, definitions, handlers.label) as CommandHandler
  );
}
