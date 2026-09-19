# @d3-polytree/core

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
