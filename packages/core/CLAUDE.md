<!-- context-forge:behavioral-contract:start -->

## How to Act

1. **Don't assume — ask, and surface tradeoffs.** _(enforced by `PLAT-01`/`PLAT-03`; `CORE-03` — the `d3polytree` value/`ensureSettings` boot contract)_
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** _(enforced by `CORE-01` — never mutate `status` on a re-render; `PLAT-04` — never hand-edit generated files)_
4. **Define success up front, then loop until verified.** _(enforced by `CORE-04` reroute-on-stack-change; `PLAT-06` determinism)_

<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->

> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · defects: [`docs/context-constitution-findings.md`](docs/context-constitution-findings.md) · inherits the root constitution. Forged by context-forge.

<!-- context-forge:constitution-pointer:end -->

# CLAUDE.md — @d3-polytree/core

Package-specific notes; see the repo-root `CLAUDE.md` for the DI model, boot-order invariant, and
jsdom shims (all most relevant here).

The engine. Source layout: `draw/` · `model/` · `modelling/` · `features/*`, plus `Diagram.ts` (the
didi bootstrap) and `index.ts` (re-exports everything + per-feature `*Module` objects).

- **Adding a drawer:** subclass the draw base, subscribe to `<class>.created` / `<class>.updated` on
  the eventBus, render into your layer, and register the selection in `DrawingRegistry`. Export a
  `xModule` (`{ __init__: ['x'], x: ['type', X], __depends__: [...] }`) and place it in the component's
  module list **before the existing drawers** if it must see the initial model (root `CLAUDE.md`,
  boot-order rule).
- **Element class** comes from `getLocalName(definition)` (strips the `pfdn:` moddle `$type`), not from
  a JS `instanceof`.
- `IconLoader` parses each icon SVG into a `<symbol>` in the shared `<defs>`, **namespaces internal
  ids** (`<key>_<id>`) to avoid collisions, and always injects a `default` fallback symbol — so
  `symbolHref('anything')` resolves even for an unknown `type`.
- The eventBus is a single `eventemitter3` instance provided by `canvasModule`; every feature injects
  the same one. Model tokens (`d3polytree.definitions` / `.moddle`) are resolved off the running
  component, which registers itself as the `d3polytree` value.
- **Culling** (`features/culling.ts`, `spatial/`): registered in `interactionModules` right after `selection` and before `outline` and the drawers. It writes exactly one thing — the transient `data-pfd-transient` attribute on an element `<g>` (never `status`, never model state). Labels are revealed on `label.created`/`.updated` _before_ Outline measures them (`getBBox` of a hidden subtree is 0×0); `CULL_MIN_ELEMENTS`/`CULL_PAD`/`HIDE_BUDGET` live in `spatial/types.ts` and are backed by `docs/design/…c10…/measurements.md`. Soft-deleted elements are not drawn, so they are never in the index.
  **Zoom-out LOD** is a state of the same class (no option; `culling:false` disables it; an `@internal` `options.lod === false` harness switch exists): at scale ≤ `LOD_SCALE_ON` (0.16) it also holds node/link slots whose flags carry no selection/focus/fresh exemption, via the same attribute (`_hold` in the hide pass), and exits **synchronously** in `_onZoomed` above `LOD_SCALE_OFF` (before the inert early return). Per-slot state (`_kind`, `_flags`, `_defs`, `_els`) is cleared by `_clearSlotState` when a slot is reused. A capture-phase `click`/`dblclick` resolver on the container re-dispatches pointer clicks on held elements through the spatial index and marks the event in `features/resolvedEvents.ts`; `Zoom`'s background handler and `MouseEvents`' per-element listeners skip marked events (never `stopPropagation` — d3-zoom's `dblclick` must run).
- D3 slices are **peer** deps — import from the specific `d3-*` package, never a `d3` bundle.
