# @d3-polytree/element

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
  - @d3-polytree/viewer@0.2.0
  - @d3-polytree/editor@0.6.0
  - @d3-polytree/interactive-viewer@0.5.2
