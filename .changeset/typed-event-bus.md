---
'@d3-polytree/canvas': minor
'@d3-polytree/core': minor
'@d3-polytree/interactive-viewer': minor
'@d3-polytree/editor': minor
---

Typed event bus (C12).

The shared `eventemitter3` bus is now typed by a single consolidated
`DiagramEventMap` (exported from `@d3-polytree/canvas`, re-exported from
`@d3-polytree/core`): `on`/`emit` are checked against a declared event name and
its argument tuple. The change is compile-time only — the runtime DI token and
the single shared instance are unchanged, so it is additive at runtime.

- **canvas** — new `DiagramEventMap`, `ElementClassName`, `MouseKind` exports;
  `Canvas`'s bus typed `EventEmitter<DiagramEventMap>`.
- **core** — every feature/drawer/modelling bus site typed; `_className`
  narrowed to `ElementClass`; event types re-exported for downstream consumers.
- **interactive-viewer / editor** — search-panel, side-tabs, and
  properties-panel bus sites typed.

Precise payload checking is delivered for canvas-expressible events (`{ svg }`,
`{ dirty }`, `{ canUndo, canRedo }`, string ids) plus the event name and arity
for every event; the drawn-selection/model payload slots are intentionally
permissive (the datum types live in `core` and cannot be named from `canvas`).
Consumers reading the bus via `viewer.get('eventBus')` can annotate it
`EventEmitter<DiagramEventMap>` for typed `on`/`emit`.
