# @d3-polytree/layout

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
