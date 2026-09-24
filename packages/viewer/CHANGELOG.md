# @d3-polytree/viewer

## 0.2.3

### Patch Changes

- 02e77ae: Keyboard-first accessibility for the diagram: `role="application"` with roving
  focus, arrow-cone navigation, an Escape hatch out of application mode, an
  `aria-live` announcer, per-element accessible names (`<title>`/`<desc>`, also in
  SSR/`exportSVG` output), a forced-colors-aware focus ring, and reduced-motion-aware
  zoom. AT forms-mode navigation is verified structurally (axe) and behaviourally
  (Playwright); a manual screen-reader pass is recommended (tracked as ROADMAP C2.a).
- Updated dependencies [02e77ae]
- Updated dependencies [02e77ae]
- Updated dependencies [02e77ae]
  - @d3-polytree/core@0.6.0

## 0.2.2

### Patch Changes

- 5bc151d: Move `eventemitter3` from `dependencies` to `devDependencies`: it is used only via `import type`
  (erased at compile), so it should not ship as a runtime dependency of the published package.
- 5bc151d: Declare the six D3 v7 slices as `peerDependencies` (required at runtime via `core`), so consumers get
  the standard peer-dependency install prompt.
- Updated dependencies [5bc151d]
  - @d3-polytree/core@0.5.2

## 0.2.1

### Patch Changes

- 8c75ec1: Docs: comprehensive per-package READMEs across the ecosystem.

  Every published package now ships a comprehensive README (install, feature/API tables, usage examples,
  where-it-fits notes, and links) so the npm package page is self-contained. `@d3-polytree/element` and
  `@d3-polytree/react` gain their first READMEs; the remaining nine are expanded to a consistent
  structure. Stale `homepage` links that pointed at a non-existent `v2` branch are corrected to `main`.
  No runtime or API changes — this is a docs/metadata-only release so the refreshed READMEs are
  republished to npm.

- Updated dependencies [8c75ec1]
  - @d3-polytree/core@0.5.1

## 0.2.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [c342677]
- Updated dependencies [cdc6008]
  - @d3-polytree/core@0.5.0

## 0.1.3

### Patch Changes

- Updated dependencies [2898d3b]
- Updated dependencies [c659d32]
  - @d3-polytree/core@0.4.0

## 0.1.2

### Patch Changes

- Updated dependencies [aea734a]
- Updated dependencies [ca348c6]
  - @d3-polytree/core@0.3.0

## 0.1.1

### Patch Changes

- Updated dependencies [f9712bb]
  - @d3-polytree/core@0.2.0

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
  - @d3-polytree/core@0.1.0
