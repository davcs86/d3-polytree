/**
 * The element `status` state machine.
 *
 * `status` is persisted verbatim on the moddle `status` attribute, so these
 * numeric values are a serialization contract — do not renumber them. Only the
 * `modelling/` + `command/` layers may change an element's status; a re-render
 * must never mutate it, or the byte-identical `toXML` round-trip breaks
 * (see CORE-01 in `packages/core/docs/context-constitution.md`).
 *
 * Transitions:
 * - create        → `New` (the moddle default, so it is not serialized)
 * - load          → unchanged (whatever the document says; absent reads as `New`)
 * - modify        → {@link markModified}: `Persisted` → `Dirty`; others unchanged
 * - delete        → `Deleted` (soft — kept in the model, skipped when drawing)
 * - undo of any   → the exact prior value, restored from the command memento
 */
export const ElementStatus = {
  /** New / unspecified — created this session, or loaded without a `status`. */
  New: 0,
  /** Persisted — loaded from a document that marked it so. */
  Persisted: 1,
  /** Soft-dirty — a `Persisted` element modified since it was loaded. */
  Dirty: 2,
  /** Soft-deleted — kept in the model (for undo / round-trip), never drawn. */
  Deleted: 3
} as const;

export type ElementStatus = (typeof ElementStatus)[keyof typeof ElementStatus];

/**
 * The status an element takes when it is modified (moved, resized, edited).
 * Only a `Persisted` element becomes `Dirty`; a `New` element stays `New` (it
 * has no persisted baseline to diverge from) and `Dirty`/`Deleted` are sticky.
 */
export function markModified(status: number | undefined): number {
  return status === ElementStatus.Persisted ? ElementStatus.Dirty : (status ?? ElementStatus.New);
}
