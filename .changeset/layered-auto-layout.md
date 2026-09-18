---
'@d3-polytree/layout': minor
'@d3-polytree/core': minor
'@d3-polytree/editor': minor
---

Add layered (Sugiyama) auto-layout (C3).

- New package **`@d3-polytree/layout`** — a pure, deterministic, dependency-free
  Sugiyama solver (cycle-break → longest-path layering → dummy chains → median +
  transpose crossing reduction → barycenter/isotonic coordinate assignment) with
  `TB`/`BT`/`LR`/`RL` directions, plus a Web Worker host (`./worker`) speaking a
  typed `postMessage` protocol that returns positions as a transferable
  `Float64Array`, and a `LayoutRunner` abstraction (sync in-thread by default,
  `WorkerLayoutRunner` to offload).
- **`@d3-polytree/core`** gains an `autoLayout` feature (`autoLayoutModule`) that
  re-lays the diagram and commits it as a single undoable `element.move`, plus an
  injectable `layoutRunner` token and re-exported layout types. A palette entry
  ("Auto-layout diagram") is added.
- **`@d3-polytree/editor`** gains `editor.autoLayout(options?)` and the palette
  button (one Ctrl+Z undoes a whole re-layout).
