# CLAUDE.md — @d3-polytree/canvas

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

The base SVG surface every higher package builds on — no engine logic here.

- `Canvas` wraps `container <div> → <svg> → root <g>` and emits `canvas.init` / `canvas.resized` /
  `canvas.destroy` on the **injected eventBus** (a caller-provided `eventemitter3`). `d3-selection` is a
  **peer** dep.
- `ElementRegistry` (ids via `ids`) owns the element store; `ElementBuilder` assigns an id then runs a
  builder callback. `getSvgString` inlines applicable CSS for a standalone SVG export.
- The **jsdom `transform.baseVal` identity fallback** lives in `Canvas.getTransform` — intentional, not
  a bug. Keep it.
- History was preserved from the standalone `d3-canvas` fork when it was absorbed (B2); `git blame`
  reaches the original authorship.
