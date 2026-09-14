/**
 * Fail-safe array helpers (ported from diagram-js's Collections util) used by
 * the modelling layer to maintain definition collections.
 */

/** Remove `element` from `collection`; returns its previous index (or -1). */
export function remove<T>(collection: T[] | undefined, element: T | undefined): number {
  if (!collection || !element) {
    return -1;
  }
  const idx = collection.indexOf(element);
  if (idx !== -1) {
    collection.splice(idx, 1);
  }
  return idx;
}

/** Add `element` to `collection` (at `idx`, or the end), avoiding duplicates. */
export function add<T>(collection: T[] | undefined, element: T | undefined, idx = -1): void {
  if (!collection || !element) {
    return;
  }
  const currentIdx = collection.indexOf(element);
  if (currentIdx !== -1) {
    if (currentIdx === idx) {
      return;
    }
    if (idx !== -1) {
      collection.splice(currentIdx, 1);
    } else {
      return; // already present
    }
  }
  if (idx !== -1) {
    collection.splice(idx, 0, element);
  } else {
    collection.push(element);
  }
}

/** Index of `element` in `collection`, or -1 (fail-safe on missing args). */
export function indexOf<T>(collection: T[] | undefined, element: T | undefined): number {
  if (!collection || !element) {
    return -1;
  }
  return collection.indexOf(element);
}
