# @d3-polytree/element

## 0.3.0

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
  - @d3-polytree/viewer@0.2.1
  - @d3-polytree/interactive-viewer@0.6.0
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
  - @d3-polytree/viewer@0.2.0
  - @d3-polytree/editor@0.6.0
  - @d3-polytree/interactive-viewer@0.5.2
