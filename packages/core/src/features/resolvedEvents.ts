/**
 * Pointer events the zoom-out LOD click resolver (`Culling`) has already turned into a
 * `<class>.<type>` bus event. Two consumers skip them so nothing is dispatched twice:
 *  - `Zoom`'s root click handler, so a resolved click never also fires `background.click`
 *    (which would clear the selection it just made);
 *  - `MouseEvents`' per-element listeners, so a click on a painted zone that the resolver turned
 *    into a click on the hidden node under it is not also delivered as `zone.click`.
 * Nothing stops propagation, so d3-zoom's own `dblclick.zoom` still runs.
 * @internal
 */
const resolvedEvents = new WeakSet<Event>();

/** @internal Mark `event` as already dispatched to the bus by the LOD click resolver. */
export function markResolved(event: Event): void {
  resolvedEvents.add(event);
}

/** @internal Whether the LOD click resolver already dispatched `event`. */
export function isResolved(event: Event): boolean {
  return resolvedEvents.has(event);
}
