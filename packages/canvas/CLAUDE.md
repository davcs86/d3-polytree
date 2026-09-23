<!-- context-forge:behavioral-contract:start -->
## How to Act

1. **Don't assume — ask, and surface tradeoffs.** *(enforced by `PLAT-03`)*
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** *(enforced by `CANVAS-01` `false`-sentinel + `CANVAS-02` layer split; `PLAT-04`)*
4. **Define success up front, then loop until verified.** *(enforced by `CANVAS-03` SSR id contract; `PLAT-06` determinism)*
<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->
> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · defects: [`docs/context-constitution-findings.md`](docs/context-constitution-findings.md) · inherits the root constitution. Forged by context-forge.
<!-- context-forge:constitution-pointer:end -->

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
