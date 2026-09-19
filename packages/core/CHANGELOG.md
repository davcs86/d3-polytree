# @d3-polytree/core

## 0.5.0

### Minor Changes

- cdc6008: Obstacle-avoiding orthogonal link routing + route pinning (roadmap C4).

  - **`@d3-polytree/core`** — a new pure, dependency-free `route/` module
    (`avoidObstacles`) nudges the orthogonal elbow around other nodes' bounding
    boxes; it is deterministic, bounded, and a no-op when nothing is in the way, so
    diagrams with clear channels route exactly as before. `computeLinkWaypoints` /
    `routeLinks` now take the node set and delegate to it. Link rerouting is driven
    by a single writer on `commandStack.changed` (once per transaction, symmetric
    across execute/undo/redo) — replacing the incident-only `node.updated`
    subscription — so a route stays correct when a _non-incident_ obstacle node
    moves or a node is created/deleted. Solved waypoints remain derived (recomputed,
    never captured), keeping `toXML` byte-identical across undo/redo.
  - **`@d3-polytree/pfdn-moddle`** — `pfdn:Link` gains a `pinned` boolean attribute
    (default `false`, omitted from XML when unset, so existing documents round-trip
    byte-identically). A pinned link keeps its authored waypoints and is skipped by
    the router (it degrades to the plain polyline).
  - **`@d3-polytree/editor`** — an `editor.setLinkPinned(id, pinned?)` method and a
    `link.pin` command (one undo step) toggle a link's pinned route.

### Patch Changes

- Updated dependencies [cdc6008]
  - @d3-polytree/pfdn-moddle@0.2.0

## 0.4.0

### Minor Changes

- 2898d3b: Add layered (Sugiyama) auto-layout (roadmap C3).

  - **New `@d3-polytree/layout` package** — a framework-free, dependency-free
    layered layout solver (cycle-break → layer assignment → crossing reduction →
    coordinate assignment), pure and unit-tested, with a `LayoutRunner` abstraction
    (sync in-thread by default, plus a `WorkerLayoutRunner` + Web Worker entry to
    offload it).
  - **`@d3-polytree/core`** — an `AutoLayout` feature (`autoLayoutModule`) that
    re-positions every live node via the solver and commits the result as **one**
    `element.move` command, so a whole re-layout is a single undo, labels move with
    their nodes and links re-route for free. The layout runner is injectable
    (`layoutRunner` token). Core re-exports the layout surface.
  - **`@d3-polytree/editor`** — an `editor.autoLayout(options?)` method and a
    palette **"Auto-layout diagram"** button (Lucide network icon).

### Patch Changes

- c659d32: Fix the Show/hide grid toggle, which appeared to do nothing. `Axes` inserted the
  grid `<g class="axis">` at `:first-child`, but `BackgroundColor` also inserts its
  opaque full-size `<rect>` at `:first-child` and boots first — so the grid ended
  up _beneath_ the background rect and was painted over. The grid rendered but was
  never visible, so toggling its `display` had no perceptible effect. `Axes` now
  inserts the grid just above the background rect (still below the diagram
  content), so it renders and the toggle visibly works.
- Updated dependencies [2898d3b]
  - @d3-polytree/layout@0.2.0

## 0.3.0

### Minor Changes

- ca348c6: Close seven V2↔V1 interaction/rendering gaps carried over from the v2.0-beta port:

  - **Initial link routing (core).** Link waypoints are now routed to edge-docked,
    orthogonal paths at load time (`loadModel`) via the new draw-independent
    `computeLinkWaypoints` / `routeLinks` in `modelling/linkRouting.ts`. Previously
    the routing only ran on `node.moved` / `node.updated`, so links loaded as a
    straight centre-to-centre line and were only corrected after a drag — and never
    in the static Viewer, which has no modelling layer. `ModellingLinks` now
    delegates to the same pure geometry, keeping drag re-routing identical.
  - **Selection outline (interactive-viewer).** The per-element `element-outline`
    rect is made visible on `.selected` / `:hover` again — the v2.0-beta outline CSS
    was never ported. Ships in `interactive-viewer/style.css`.
  - **Chrome icons (core).** The former (never-ported) fontello icon font is replaced
    with inline SVG icons from [Lucide](https://lucide.dev) (the icon set behind
    shadcn/ui), vendored as a small typed registry in `core` (`createIcon` /
    `UiIconName`) — no icon font, no binary asset, no runtime dependency. The
    side-tab, search, properties, palette and close icons all render as accessible,
    `currentColor`-tinted inline SVG. Palette/side-tab entries now take a semantic
    `icon` key instead of the old `iconClassName` CSS class.
  - **Closable side panel (interactive-viewer).** Clicking the already-active side
    tab now collapses the panel; the close "×" is visible again (inline SVG).
  - **Editor toolbar (editor).** The palette toolbar CSS was never ported, leaving
    an invisible block of empty spans; `editor/style.css` now carries the palette
    styling.
  - **Drag cursor (core + editor).** `Drag` toggles `cursor-grabbing` on the root
    layer for the duration of a gesture; the matching `cursor: move` rule ships in
    `editor/style.css`.
  - **Multi-element drag (core).** Grabbing a member of a multi-selection no longer
    collapses the selection to that one element (d3-drag strips `ctrlKey`, so the
    drag-start `select()` was always a replace); the whole group now drags together.
    `Drag.beginDrag` / `Drag.endDrag` are exposed for this and are unit-testable.

### Patch Changes

- aea734a: Fix two coupled selection/undo bugs around clicking a node:

  - **No zero-delta move on the undo stack.** d3-drag reports a plain click as
    `start` + `end` with no `drag` between, so `Drag.notifyMovedSelected()` was
    committing an `element.move` whose `to` equals its `from` — a no-op that still
    landed on the undo stack, making every click a silent undo step. It now commits
    only when the gesture actually moved something.
  - **A node click no longer clears its own selection.** The drawing-layer click
    handler emitted `background.click` (which clears the selection) for any click
    whose target was not the outline — including a click that bubbled up from a
    node's inner `<use>`/`<rect>`. Selecting a node by clicking it then immediately
    cleared it. The handler now ignores clicks that land on any drawn element
    (`.element` / `.element-outline`). This bug was previously masked by the no-op
    move above; removing that unmasked it, so both are fixed together.

## 0.2.0

### Minor Changes

- f9712bb: Typed event bus (C12).

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

### Patch Changes

- Updated dependencies [f9712bb]
- Updated dependencies [f9712bb]
  - @d3-polytree/canvas@0.2.0

## 0.1.0

### Minor Changes

- dfd1db2: Initial public release of the modernized d3-polytree v2 ecosystem: a TypeScript +
  ESM pnpm monorepo publishing the `@d3-polytree/*` packages with slim, modular D3 v7
  peer dependencies.

  - Engine: `@d3-polytree/canvas`, `@d3-polytree/pfdn-moddle`, `@d3-polytree/core`.
  - Components: `@d3-polytree/viewer`, `@d3-polytree/interactive-viewer`,
    `@d3-polytree/editor` (each also ships a self-contained UMD bundle).
  - Panels: `@d3-polytree/side-tabs`, `@d3-polytree/search-panel`,
    `@d3-polytree/properties-panel` (with compiled CSS).
  - Icon pack: `@d3-polytree/icons-amazon`.

  Note for the maintainer: this changeset bumps every package by a `minor` step
  (0.0.0 → 0.1.0). Edit it to `major` before running the release if the first
  public version should be 1.0.0 (or set the versions explicitly).

### Patch Changes

- Updated dependencies [dfd1db2]
  - @d3-polytree/canvas@0.1.0
  - @d3-polytree/pfdn-moddle@0.1.0
