---
'@d3-polytree/element': minor
'@d3-polytree/react': minor
'@d3-polytree/core': minor
---

`.pfdn` import failures are no longer dropped:

- `<d3-polytree-editor>` dispatches an `error` `CustomEvent` (`detail`: the error).
- `<PolytreeEditor>` gains an `onError` prop. Without it, the error is logged with `console.error`.
- The palette's **Open** reports the failure through the `notifications` service. `Upload` now
  injects `notifications`.

In every case, a document that is already open stays open.
