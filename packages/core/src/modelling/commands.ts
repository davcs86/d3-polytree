import type { CommandContext, CommandHandler, CommandStack } from '../command';
import type { Point } from '../draw';
import * as collections from '../utils/collections';
import { getLocalName } from '../utils/localName';
import type { ModellingElement } from './ModellingElement';
import type { ElementClass } from './Modelling';
import type { ModellingModelElement } from './types';
import { ElementStatus } from '../model/status';

/** A node's resizable geometry — the memento for `element.resize`. */
export interface Geometry {
  size: number;
  position: { x: number; y: number };
}

function applyGeometry(def: ModellingModelElement, g: Geometry): void {
  def.size = g.size;
  const pos = def.position as Point;
  pos.x = g.position.x;
  pos.y = g.position.y;
}

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

/** `element.delete` — soft-delete an element (and cascade its read-only label). */
export interface DeleteContext extends CommandContext {
  def: ModellingModelElement;
  className: ElementClass;
  /** Set by `execute` (the memento): prior status of the element and its label. */
  prevStatus?: number;
  label?: ModellingModelElement;
  labelPrevStatus?: number;
  labelPrevReadOnly?: boolean;
}

/** Build the `element.delete` command handler. */
export function deleteElementCommand(
  handlers: ElementHandlers,
  labelHandler: ModellingElement
): CommandHandler<DeleteContext> {
  return {
    // An associated read-only label is never deleted on its own (source parity).
    canExecute: (ctx) => !(ctx.className === 'label' && ctx.def.isReadOnly === true),
    execute(ctx) {
      const def = ctx.def;
      ctx.prevStatus = def.get('status') as number;
      const label = def.get('label') as ModellingModelElement | undefined;
      if (ctx.className !== 'label' && label && label.$instanceOf('pfdn:Label')) {
        // cascade: capture then soft-delete the associated label too
        ctx.label = label;
        ctx.labelPrevStatus = label.get('status') as number;
        ctx.labelPrevReadOnly = label.isReadOnly;
        label.isReadOnly = false;
        label.set('status', ElementStatus.Deleted);
        labelHandler.reconcile(label.id as string, undefined);
      }
      def.set('status', ElementStatus.Deleted);
      handlers[ctx.className].reconcile(def.id as string, undefined);
    },
    revert(ctx) {
      const def = ctx.def;
      // Restore all model props first, then reconcile (drawings re-render from
      // fully-restored state).
      def.set('status', ctx.prevStatus);
      if (ctx.label) {
        ctx.label.set('status', ctx.labelPrevStatus);
        ctx.label.isReadOnly = ctx.labelPrevReadOnly;
      }
      handlers[ctx.className].reconcile(def.id as string, def);
      if (ctx.label) {
        labelHandler.reconcile(ctx.label.id as string, ctx.label);
      }
    }
  };
}

/** `elements.delete` — a composite that deletes a whole selection as ONE entry. */
export interface DeleteBatchContext extends CommandContext {
  items: { def: ModellingModelElement; className: ElementClass }[];
}

/** Build the composite: each child `element.delete` joins this transaction. */
export function deleteBatchCommand(commandStack: CommandStack): CommandHandler<DeleteBatchContext> {
  return {
    preExecute(ctx) {
      for (const item of ctx.items) {
        commandStack.execute('element.delete', {
          def: item.def,
          className: item.className
        } as DeleteContext);
      }
    },
    // The children did the work; the composite is just the transaction boundary.
    execute() {},
    revert() {}
  };
}

/** `element.resize` — restore a node's size + position on revert. */
export interface ResizeContext extends CommandContext {
  def: ModellingModelElement;
  className: ElementClass;
  from: Geometry;
  to: Geometry;
}

/** Build the `element.resize` command handler. */
export function resizeElementCommand(handlers: ElementHandlers): CommandHandler<ResizeContext> {
  return {
    execute(ctx) {
      // The live drag already wrote `to`; re-applying is idempotent and makes
      // redo work from any state.
      applyGeometry(ctx.def, ctx.to);
      handlers[ctx.className].reconcile(ctx.def.id as string, ctx.def);
    },
    revert(ctx) {
      applyGeometry(ctx.def, ctx.from);
      handlers[ctx.className].reconcile(ctx.def.id as string, ctx.def);
    }
  };
}

/** `element.move` — a batched, undoable move of a whole selection. */
export interface Placement {
  position: { x: number; y: number };
  status: number;
}

function applyPlacement(def: ModellingModelElement, p: Placement): void {
  const pos = def.position as Point;
  pos.x = p.position.x;
  pos.y = p.position.y;
  def.set('status', p.status);
}

export interface MoveItem {
  def: ModellingModelElement;
  className: ElementClass;
  from: Placement;
  to: Placement;
  /** The dragged element's associated label moves in lockstep. */
  label?: { def: ModellingModelElement; from: Placement; to: Placement };
}

export interface MoveContext extends CommandContext {
  items: MoveItem[];
}

/**
 * Build the `element.move` command. Links are NOT in the memento: their solved
 * waypoints are a pure function of node positions, recomputed by the single
 * reroute pass that `ModellingLinks` runs on `commandStack.changed` after this
 * command (on execute, undo, and redo alike). All positions are written before
 * any reconcile, so that pass routes against fully-restored endpoints (never an
 * intermediate state). Only a *pinned* link's waypoints are authored state, and
 * those the reroute deliberately skips.
 */
export function moveElementsCommand(handlers: ElementHandlers): CommandHandler<MoveContext> {
  const applyAll =
    (which: 'from' | 'to') =>
    (ctx: MoveContext): void => {
      // 1. write every position/status first
      for (const it of ctx.items) {
        applyPlacement(it.def, it[which]);
        if (it.label) {
          applyPlacement(it.label.def, it.label[which]);
        }
      }
      // 2. then reconcile every touched drawing (the commandStack.changed reroute
      //    pass then re-routes all unpinned links against the final positions)
      for (const it of ctx.items) {
        handlers[it.className].reconcile(it.def.id as string, it.def);
        if (it.label) {
          handlers.label.reconcile(it.label.def.id as string, it.label.def);
        }
      }
    };
  return { execute: applyAll('to'), revert: applyAll('from') };
}

/**
 * `link.pin` — toggle a link's `pinned` flag (C4). The memento is the flag only:
 * a pinned link keeps its authored waypoints (the reroute pass skips it), and
 * solved waypoints are never captured (they stay derived). It performs NO
 * reconcile, so it cannot flip a `status:0` link to `2` — no `toXML` residue.
 */
export interface PinContext extends CommandContext {
  def: ModellingModelElement;
  before: boolean;
  after: boolean;
}

export function pinLinkCommand(): CommandHandler<PinContext> {
  return {
    execute(ctx) {
      ctx.def.set('pinned', ctx.after);
    },
    revert(ctx) {
      ctx.def.set('pinned', ctx.before);
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
  commandStack.registerHandler(
    'element.delete',
    deleteElementCommand(handlers, handlers.label) as CommandHandler
  );
  commandStack.registerHandler(
    'elements.delete',
    deleteBatchCommand(commandStack) as CommandHandler
  );
  commandStack.registerHandler('element.resize', resizeElementCommand(handlers) as CommandHandler);
  commandStack.registerHandler('element.move', moveElementsCommand(handlers) as CommandHandler);
  commandStack.registerHandler('link.pin', pinLinkCommand() as CommandHandler);
}
