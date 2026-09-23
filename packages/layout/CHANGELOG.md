# @d3-polytree/layout

## 0.2.2

### Patch Changes

- 5bc151d: Robustness: `resolveOptions` clamps out-of-range values (negative/NaN spacing and negative iteration
  counts) to sane minimums, and `WorkerLayoutRunner` takes a `timeoutMs` (default 30000) that rejects a
  hung or crashed worker instead of leaving the promise pending forever.

## 0.2.1

### Patch Changes

- 8c75ec1: Docs: comprehensive per-package READMEs across the ecosystem.

  Every published package now ships a comprehensive README (install, feature/API tables, usage examples,
  where-it-fits notes, and links) so the npm package page is self-contained. `@d3-polytree/element` and
  `@d3-polytree/react` gain their first READMEs; the remaining nine are expanded to a consistent
  structure. Stale `homepage` links that pointed at a non-existent `v2` branch are corrected to `main`.
  No runtime or API changes — this is a docs/metadata-only release so the refreshed READMEs are
  republished to npm.

## 0.2.0

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
