# @d3-polytree/react

## 0.4.2

### Patch Changes

- Updated dependencies [f34bdb9]
  - @d3-polytree/editor@0.8.3

## 0.4.1

### Patch Changes

- Updated dependencies [f8c6206]
  - @d3-polytree/interactive-viewer@0.7.2
  - @d3-polytree/editor@0.8.2

## 0.4.0

### Minor Changes

- 4c49962: `.pfdn` import failures are no longer dropped:

  - `<d3-polytree-editor>` dispatches an `error` `CustomEvent` (`detail`: the error).
  - `<PolytreeEditor>` gains an `onError` prop. Without it, the error is logged with `console.error`.
  - The palette's **Open** reports the failure through the `notifications` service. `Upload` now
    injects `notifications`.

  In every case, a document that is already open stays open.

### Patch Changes

- 4c49962: Safe before a diagram has loaded:

  - `Editor.undo/redo/markSaved` are no-ops, and `canUndo/canRedo/isDirty` return
    `false`. They used to throw `no diagram loaded`.
  - `<d3-polytree-editor>.value` and the React handle's `export()` return the last
    document handed in.

- 4c49962: Declare the six D3 v7 slices as peer dependencies, and
  `@d3-polytree/interactive-viewer` (whose `style.css` the README imports) as a
  dependency, so strict installs resolve them.
- Updated dependencies [4c49962]
- Updated dependencies [4c49962]
- Updated dependencies [4c49962]
  - @d3-polytree/interactive-viewer@0.7.1
  - @d3-polytree/editor@0.8.1

## 0.3.0

### Minor Changes

- d615807: Both adapters accept extra didi `modules` (icon packs, custom features): a
  `modules` JS property on `<d3-polytree-editor>` and a `modules` prop on
  `<PolytreeEditor>`. A different array after mount reboots the engine in place and
  re-imports the current document (undo/selection reset); arrays are compared by
  identity.

### Patch Changes

- Updated dependencies [02e77ae]
- Updated dependencies [02e77ae]
- Updated dependencies [d615807]
- Updated dependencies [d615807]
- Updated dependencies [d615807]
- Updated dependencies [d615807]
  - @d3-polytree/editor@0.8.0

## 0.2.2

### Patch Changes

- Updated dependencies [5bc151d]
- Updated dependencies [5bc151d]
  - @d3-polytree/editor@0.7.1

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
- Updated dependencies [7ed534c]
  - @d3-polytree/editor@0.7.0

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

- Updated dependencies [05f45d3]
- Updated dependencies [cdc6008]
  - @d3-polytree/editor@0.6.0
