# @d3-polytree/editor

## 0.7.1

### Patch Changes

- 5bc151d: Fix the tsup library build to keep `@d3-polytree/interactive-viewer` external (it was omitted from the
  `external` list, so the ESM/CJS bundle inlined all of the parent package). Also correct the README API
  table (add `setLinkPinned`, `canUndo`, `canRedo`).
- 5bc151d: Declare the six D3 v7 slices as `peerDependencies` (required at runtime via `core`), and move
  `eventemitter3` to `devDependencies` (used only via `import type`).
- Updated dependencies [5bc151d]
- Updated dependencies [5bc151d]
- Updated dependencies [5bc151d]
- Updated dependencies [5bc151d]
  - @d3-polytree/core@0.5.2
  - @d3-polytree/interactive-viewer@0.6.1
  - @d3-polytree/viewer@0.2.2

## 0.7.0

### Minor Changes

- 7ed534c: Theming: CSS custom properties, dark mode, and forced-colors support (roadmap C13).

  Chrome (panels, notifications, palette, side-tabs, search, selection outline) is now driven by a
  tokenised `--pfd-*` colour system defined on `:root, :host` in a shared `_tokens.scss`. A **dark scheme**
  follows the OS `prefers-color-scheme` automatically and can be forced per-instance with a
  `data-pfd-theme="light" | "dark"` attribute; **`forced-colors` (high-contrast)** maps the selection outline
  and focus rings to system colours. Light values equal the previous literals exactly, so existing light
  rendering is unchanged. Colours are derived with `color-mix()` in the dark scheme.

  The diagram body (nodes, links, zones, labels, icons) and the canvas backdrop are intentionally **not**
  themed — those colours are the user's document data. Exports stay theme-invariant.

  - **`@d3-polytree/interactive-viewer`** — the token system + dark/forced-colors rules for the outline,
    notifications, side-tabs, and search panels.
  - **`@d3-polytree/editor`** — the palette and properties-panel chrome consume the same tokens.
  - **`@d3-polytree/element`** — the tokens flow into the shadow root automatically; `exportSVG()` now pins
    the export to the light theme so a themed viewer never leaks into exported SVG.

  Consumers can re-theme by overriding the `--pfd-color-*` custom properties, or set
  `data-pfd-theme` on a container / the `<d3-polytree-editor>` element to force a scheme.

### Patch Changes

- 8c75ec1: Docs: comprehensive per-package READMEs across the ecosystem.

  Every published package now ships a comprehensive README (install, feature/API tables, usage examples,
  where-it-fits notes, and links) so the npm package page is self-contained. `@d3-polytree/element` and
  `@d3-polytree/react` gain their first READMEs; the remaining nine are expanded to a consistent
  structure. Stale `homepage` links that pointed at a non-existent `v2` branch are corrected to `main`.
  No runtime or API changes — this is a docs/metadata-only release so the refreshed READMEs are
  republished to npm.

- Updated dependencies [8c75ec1]
- Updated dependencies [7ed534c]
  - @d3-polytree/core@0.5.1
  - @d3-polytree/viewer@0.2.1
  - @d3-polytree/interactive-viewer@0.6.0

## 0.6.0

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

- 05f45d3: Custom Element + React adapter (roadmap C7).

  - **New `@d3-polytree/element`** — the framework-free `<d3-polytree-editor>` custom
    element. Hosts the editor in a shadow root, reflects the serialized `.pfdn` as a
    `value` property/attribute, participates in `<form>`s via `ElementInternals`
    (feature-gated — degrades gracefully where unsupported), emits a `change`
    `CustomEvent` on every committed edit, and inlines the compiled component CSS
    into its shadow root. Ships a UMD (`d3PolytreeElement`) that self-registers the
    tag for a `<script>` drop-in.
  - **New `@d3-polytree/react`** — a thin, uncontrolled React wrapper
    (`<PolytreeEditor defaultValue onChange onSelectionChange ref>`). It bridges the
    engine event bus via `useSyncExternalStore` (a monotonic version-counter
    snapshot, tear-free under React 18/19), with an imperative `ref`
    (`getEditor`/`load`/`export`). React is a peer dependency (`>=18`).
  - **`@d3-polytree/viewer`** — a new stable `on(event, handler)` / `off(...)` surface
    (for `document.changed` / `selection.changed` / `commandStack.changed`) that
    **survives `importDiagram`/`createEmpty` reboots**: the component re-attaches
    registered handlers to the fresh event bus on each boot. Inherited by
    `InteractiveViewer` and `Editor`.
  - **`@d3-polytree/editor`** — routing a diagram reboot through the new non-virtual
    teardown fixes a latent bug where re-opening a document (`importDiagram` /
    `createDiagram`) stripped the editor's undo/redo keyboard shortcuts.

- Updated dependencies [05f45d3]
- Updated dependencies [c342677]
- Updated dependencies [cdc6008]
  - @d3-polytree/viewer@0.2.0
  - @d3-polytree/core@0.5.0
  - @d3-polytree/interactive-viewer@0.5.2

## 0.5.0

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

- Updated dependencies [2898d3b]
- Updated dependencies [c659d32]
  - @d3-polytree/core@0.4.0
  - @d3-polytree/interactive-viewer@0.5.1
  - @d3-polytree/viewer@0.1.3

## 0.4.1

### Patch Changes

- 8394296: Fix three more editor interaction bugs surfaced after the V2↔V1 gap work:

  - **New / Save were no-ops (interactive-viewer, editor).** The engine's default
    `notifications` is the headless `ConsoleNotificationService`, which only logs
    and reports every confirmation as _cancelled_ — so the palette's "New" never
    reached `createDiagram`, and "Save" persisted silently with no feedback. Adds a
    dependency-free DOM notifications UI (`DomNotifications` / `domNotificationsModule`)
    — transient toasts plus a modal confirm dialog — composed **last** by the
    interactive components so it wins the `notifications` token. (The beta bound
    this role to `sweetalert`; this is the modern, no-dependency replacement.)
  - **Properties-panel inner tabs navigated on click (editor).** The Properties /
    Format tab labels were `<a href="#">`, so switching tabs appended a hash /
    history entry every time. The label is no longer a navigating link and the tab
    click is `preventDefault`-ed.
  - **Newly added nodes were missing from the search panel (interactive-viewer).**
    The search index skipped elements with an empty caption, and a node's label
    text is set _after_ its `node.created` fires, so freshly added nodes never
    appeared. The list now falls back to the element id when there is no caption
    yet and refreshes on `node.updated` / `link.updated`, so added and renamed
    elements show correctly.

- Updated dependencies [8394296]
  - @d3-polytree/interactive-viewer@0.5.0

## 0.4.0

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

- Updated dependencies [aea734a]
- Updated dependencies [ca348c6]
  - @d3-polytree/core@0.3.0
  - @d3-polytree/interactive-viewer@0.4.0
  - @d3-polytree/viewer@0.1.2

## 0.3.0

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
  - @d3-polytree/core@0.2.0
  - @d3-polytree/interactive-viewer@0.3.0
  - @d3-polytree/viewer@0.1.1

## 0.2.0

### Minor Changes

- 25cec92: Fold the panel packages into their components (decision O10). `@d3-polytree/side-tabs`
  and `@d3-polytree/search-panel` are now internal to `@d3-polytree/interactive-viewer`;
  `@d3-polytree/properties-panel` is now internal to `@d3-polytree/editor`. The panels had
  no consumer outside the components.

  - Their didi modules and public types are re-exported from the parents, so
    `import { sideTabsModule, searchPanelModule } from '@d3-polytree/interactive-viewer'`
    and `import { propertiesPanelModule, entryFactoryModule, pfdnPropertiesProviderModule }
from '@d3-polytree/editor'` keep working.
  - Their compiled CSS now ships as the parents' `./style.css`:
    `@d3-polytree/interactive-viewer/style.css` (side-tabs + search-panel) and
    `@d3-polytree/editor/style.css` (properties panel). Editor consumers import both.

  The standalone `@d3-polytree/{side-tabs,search-panel,properties-panel}` packages are
  discontinued; the already-published 0.1.0 versions should be deprecated on npm pointing
  to their new homes.

### Patch Changes

- Updated dependencies [25cec92]
  - @d3-polytree/interactive-viewer@0.2.0

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

- cf150a3: Add a `modules` constructor option to the components (`new Editor({ modules: [...] })`).
  Caller-supplied didi modules are composed after the component's own — last
  definition of a token wins — so a custom feature, drawer, icon pack, or service
  can be layered in without subclassing. See the Storybook "Guides/Kitchensink"
  story for a worked example.

### Patch Changes

- Updated dependencies [dfd1db2]
- Updated dependencies [cf150a3]
  - @d3-polytree/core@0.1.0
  - @d3-polytree/viewer@0.1.0
  - @d3-polytree/interactive-viewer@0.1.0
  - @d3-polytree/properties-panel@0.1.0
