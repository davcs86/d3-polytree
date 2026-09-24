/**
 * The command layer's handler contract.
 *
 * A {@link CommandHandler} is the sole place a model mutation is applied and
 * inverted. The **context object is the memento**: `execute` captures the prior
 * values it will need onto the very context it is handed, and `revert` restores
 * from them — there is no separate snapshot store and no document clone. A
 * context therefore holds ids and plain model-prop values only (never live
 * element handles or D3 selections), which keeps it serializable (decision O13)
 * so a future collaboration adapter is an adapter, not a rewrite.
 */

/** A command's memento — plain, serializable values keyed by name. */
export interface CommandContext {
  [key: string]: unknown;
}

/**
 * Applies and inverts one kind of model mutation.
 *
 * Lifecycle per `execute(command, context)` on the stack: `canExecute?` gates,
 * then `preExecute?` (may dispatch sub-commands that join the transaction),
 * then `execute` (captures prior state onto the context and applies the change),
 * then `postExecute?` (may dispatch trailing sub-commands). `revert` is the
 * exact inverse of `execute`, restoring from the context.
 */
export interface CommandHandler<C extends CommandContext = CommandContext> {
  /** Optional gate: return false to skip the command (nothing is recorded). */
  canExecute?(context: C): boolean;
  /** Runs before {@link execute}; may issue sub-commands that join the transaction. */
  preExecute?(context: C): void;
  /** Capture prior state onto `context`, then apply the mutation. */
  execute(context: C): void;
  /** The exact inverse of {@link execute}, restoring from `context`. */
  revert(context: C): void;
  /** Runs after {@link execute}; may issue sub-commands that join the transaction. */
  postExecute?(context: C): void;
  /**
   * Optional coalescing hook (see C15). When the stack decides two consecutive
   * top-level commands may merge — same `mergeKey` passed to {@link CommandStack.execute},
   * the mergeable entry is the live top, and the redo tail is empty — it calls
   * `merge` on the **surviving earlier** command's handler with `prev` = that
   * earlier memento and `next` = the newer one. Fold `next`'s forward state into
   * `prev` **in place**, keeping `prev`'s captured pre-state, and return `true` to
   * coalesce the two into one undo entry. **Must not mutate `next`.** Return
   * `false` (or omit `merge`) to record `next` as its own entry. Because the model
   * is already at `next`'s applied state when this runs, a coalesced entry reverts
   * to the pre-burst state and redoes to the latest — one Ctrl+Z per burst.
   */
  merge?(prev: C, next: C): boolean;
}
