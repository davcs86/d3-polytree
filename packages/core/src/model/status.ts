/**
 * The element `status` state machine.
 *
 * `status` is persisted verbatim on the moddle `status` attribute, so these
 * numeric values are a serialization contract — do not renumber them. Only the
 * `modelling/` + `command/` layers may change an element's status; a re-render
 * must never mutate it, or the byte-identical `toXML` round-trip breaks
 * (see CORE-01 in `packages/core/docs/context-constitution.md`).
 */
export const ElementStatus = {
  /** New / transient — created this session, not yet persisted. */
  New: 0,
  /** Persisted / loaded from the document. */
  Persisted: 1,
  /** Soft-dirty — modified since it was loaded. */
  Dirty: 2,
  /** Soft-deleted. */
  Deleted: 3
} as const;

export type ElementStatus = (typeof ElementStatus)[keyof typeof ElementStatus];
