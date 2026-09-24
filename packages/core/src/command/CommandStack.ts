import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { CommandContext, CommandHandler } from './CommandHandler';

/** One recorded command: the registered name plus its memento context. */
interface Command {
  command: string;
  context: CommandContext;
}

/** A transaction is the unit of undo/redo — one or more commands, one entry. */
type Transaction = Command[];

/**
 * Transactional undo/redo for the engine.
 *
 * Every model mutation flows through {@link execute}; each registered
 * {@link CommandHandler} applies and inverts one kind of change (see O11 — full
 * reroute). A top-level `execute` opens a transaction; any `execute` issued from
 * a handler's `preExecute`/`postExecute` **joins** it, so a multi-element gesture
 * (a multi-select delete, a batched move) is a single stack entry / one Ctrl+Z.
 *
 * **Boot latch.** The stack is disabled until `d3canvas.init` (emitted by
 * `Diagram` after the injector — and therefore the initial render — is built),
 * so the boot render never records undo entries: `canUndo()` is false on a
 * freshly imported document. `d3canvas.destroy`/`d3canvas.clear` quarantine it.
 *
 * **Failure semantics.** If an `execute` throws mid-transaction, the commands
 * already applied are best-effort reverted and the entry is never recorded. If a
 * `revert`/`redo` throws, the rest of the transaction is still best-effort
 * unwound, then the whole stack is **quarantined** (disabled + cleared) and a
 * fatal `document.inconsistent` event is emitted — never a silently half-mutated
 * document with a live stack over it.
 */
export class CommandStack {
  static readonly $inject = ['eventBus'];

  private readonly _eventBus: EventEmitter<DiagramEventMap>;
  private readonly _handlers = new Map<string, CommandHandler>();
  private _stack: Transaction[] = [];
  /** Index of the last-applied transaction; -1 when nothing is applied. */
  private _pointer = -1;
  /** The open transaction accumulator, or null when none is in flight. */
  private _txn: Transaction | null = null;
  private _enabled = false;
  /**
   * The merge key of the last recorded top-level transaction, or null when no
   * burst is in flight. Only a fresh top-level `execute` carrying the same key,
   * with the mergeable entry still the live top and an empty redo tail, coalesces
   * (C15). Cleared on undo/redo/clear/quarantine and on any non-mergeable close.
   */
  private _lastMergeKey: string | null = null;

  constructor(eventBus: EventEmitter<DiagramEventMap>) {
    this._eventBus = eventBus;
    // Enable only once the injector (and thus the initial render) is built, so
    // the boot round-trip records nothing; tear-down quarantines the stack.
    eventBus.on('d3canvas.init', this._enable, this);
    eventBus.on('d3canvas.destroy', this._quarantine, this);
    eventBus.on('d3canvas.clear', this._quarantine, this);
  }

  /** Register the handler that applies/inverts `command`. Last registration wins. */
  registerHandler(command: string, handler: CommandHandler): void {
    this._handlers.set(command, handler);
  }

  /**
   * Apply `command` with `context`. Opens a transaction when none is in flight;
   * a nested call (from a handler's pre/postExecute) joins the open one.
   */
  execute(command: string, context: CommandContext, mergeKey?: string): void {
    const opened = this._txn === null;
    if (opened) {
      this._txn = [];
    }
    try {
      this._runCommand(command, context);
    } catch (err) {
      if (opened) {
        this._bestEffortRevert(this._txn as Transaction);
        this._txn = null;
      }
      throw err;
    }
    // A nested (joining) call never touches the burst state — only the
    // enclosing top-level close records and updates `_lastMergeKey`.
    if (!opened) {
      return;
    }
    const txn = this._txn as Transaction;
    this._txn = null;
    // Pre-boot (disabled) mutations apply but are never recorded, and a
    // canExecute no-op (empty txn) breaks any in-flight burst.
    if (this._enabled && txn.length > 0) {
      // Coalesce into the live top when the caller opts in with a matching key
      // and the handler folds the newer memento into the surviving one (C15).
      // Guarded by an empty redo tail (`_pointer === _stack.length - 1`) so a
      // burst never merges into an entry left behind by an undo.
      const top = this._pointer >= 0 ? this._stack[this._pointer] : undefined;
      if (
        mergeKey != null &&
        this._lastMergeKey === mergeKey &&
        this._pointer === this._stack.length - 1 &&
        top !== undefined &&
        txn.length === 1 &&
        top.length === 1 &&
        top[0].command === txn[0].command &&
        this._handlers.get(txn[0].command)?.merge?.(top[0].context, txn[0].context)
      ) {
        this._lastMergeKey = mergeKey;
        this._emitChanged();
        return;
      }
      this._stack.length = this._pointer + 1; // truncate any redo tail
      this._stack.push(txn);
      this._pointer = this._stack.length - 1;
      this._lastMergeKey = mergeKey ?? null;
      this._emitChanged();
    } else {
      this._lastMergeKey = null;
    }
  }

  private _runCommand(command: string, context: CommandContext): void {
    const handler = this._handlers.get(command);
    if (!handler) {
      throw new Error(`no command handler registered for "${command}"`);
    }
    if (handler.canExecute && !handler.canExecute(context)) {
      return;
    }
    handler.preExecute?.(context);
    handler.execute(context);
    (this._txn as Transaction).push({ command, context });
    handler.postExecute?.(context);
  }

  /** True when there is an applied transaction to undo (and the stack is live). */
  canUndo(): boolean {
    return this._enabled && this._pointer >= 0;
  }

  /** True when there is an undone transaction to redo (and the stack is live). */
  canRedo(): boolean {
    return this._enabled && this._pointer < this._stack.length - 1;
  }

  /** Revert the last-applied transaction (its commands in reverse order). */
  undo(): void {
    if (!this.canUndo()) {
      return;
    }
    const txn = this._stack[this._pointer];
    this._pointer -= 1;
    this._lastMergeKey = null; // an undo ends any in-flight merge burst
    const errors = this._revertAll(txn);
    if (errors.length > 0) {
      this._fail(errors);
      return;
    }
    this._emitChanged();
  }

  /** Re-apply the next undone transaction (its commands in order). */
  redo(): void {
    if (!this.canRedo()) {
      return;
    }
    const txn = this._stack[this._pointer + 1];
    this._pointer += 1;
    this._lastMergeKey = null; // a redo ends any in-flight merge burst
    const errors: unknown[] = [];
    for (const { command, context } of txn) {
      try {
        this._handlers.get(command)?.execute(context);
      } catch (e) {
        errors.push(e);
      }
    }
    if (errors.length > 0) {
      this._fail(errors);
      return;
    }
    this._emitChanged();
  }

  /** Drop all history (keeps the stack enabled). */
  clear(): void {
    this._stack = [];
    this._pointer = -1;
    this._lastMergeKey = null;
    this._emitChanged();
  }

  private _enable(): void {
    this._enabled = true;
  }

  private _revertAll(txn: Transaction): unknown[] {
    const errors: unknown[] = [];
    for (let i = txn.length - 1; i >= 0; i -= 1) {
      const { command, context } = txn[i];
      try {
        this._handlers.get(command)?.revert(context);
      } catch (e) {
        errors.push(e); // best-effort: keep unwinding the rest
      }
    }
    return errors;
  }

  /** Unwind a failed in-flight transaction; secondary errors are swallowed. */
  private _bestEffortRevert(txn: Transaction): void {
    this._revertAll(txn);
  }

  private _quarantine(): void {
    this._enabled = false;
    this._stack = [];
    this._pointer = -1;
    this._txn = null;
    this._lastMergeKey = null;
  }

  /** A revert/redo threw: quarantine and surface the fatal inconsistency. */
  private _fail(errors: unknown[]): void {
    this._quarantine();
    const aggregated = new Error(
      'command stack quarantined after a failed revert; document may be inconsistent'
    ) as Error & { causes?: unknown[] };
    aggregated.causes = errors;
    this._eventBus.emit('document.inconsistent', aggregated);
    throw aggregated;
  }

  private _emitChanged(): void {
    const canUndo = this.canUndo();
    this._eventBus.emit('commandStack.changed', { canUndo, canRedo: this.canRedo() });
    // A document is dirty once it has an undoable change past the boot baseline
    // (the stack records nothing until `d3canvas.init`). Save-baseline reset /
    // debounce is a deferred refinement (design Open Risk).
    this._eventBus.emit('document.changed', { dirty: canUndo });
  }
}
