# @d3-polytree/ssr — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the Node SVG
renderer — the pre-claim/boot ordering, the add-only jsdom lifecycle, and the determinism seam it
inherits. Does not restate the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/ssr**.

## Rules (`SSR-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **SSR-01** | `render` parses the XML **twice** and **pre-claims every author id before the viewer boots**; don't drop the first parse or claim ids after boot. | `SequentialIdGenerator.nextPrefixed` only skips ids already in `_claimed`, and an id-less node can render before its author-set namesake — so pre-claim must precede boot or generated ids collide with author ids (guarded by the `MIXED_IDS` test). | `packages/ssr/src/index.ts#render`, `#preclaimIds`, `packages/ssr/src/renderToSvg.test.ts` ("does not collide a generated id") | `packages/ssr/src/index.ts#preclaimIds` |
| **SSR-02** | jsdom globals are installed **add-only** (skip keys already present, so JS intrinsics / cross-realm `instanceof` stay intact) and restored to **exactly the added keys** in `finally`; a module-level promise chain serializes overlapping renders (globalThis is shared). | An early `return`/branch outside the `finally` leaks jsdom globals onto `globalThis` and corrupts the next queued render. | `packages/ssr/src/dom.ts#installDom`, `#uninstallDom`, `packages/ssr/src/index.ts#render` (try/finally + `chain`) | `packages/ssr/src/dom.ts#installDom` |
| **SSR-03** | The determinism seam is the `idGenerator` **token override** — `modules: [{ idGenerator: ['value', gen] }]` relying on didi last-wins (owned by canvas) plus Viewer appending caller modules last (`PLAT-03`). | Breaks if canvas stops defaulting the `idGenerator` token or Viewer stops appending caller modules last. | `packages/ssr/src/index.ts#render`, `packages/canvas/src/module.ts#canvasModule` | `packages/ssr/src/index.ts#render` |

## Norms (`SSR-*`) — defaults & asymmetry guidance

_None._

## Gotchas & scars

- **The jsdom geometry shims live in core/canvas, not here** (zero-box `getBBox`, identity transform, d3-zoom `.extent()`). "Flat geometry" output is inherited — an agent trying to "fix flat geometry" inside ssr is looking in the wrong package. Evidence: `packages/canvas/src/Canvas.ts#getTransform`, root `CLAUDE.md#Gotchas`.

## Candidate rules (unverified)

| Candidate | Why suspected | What would confirm it |
|---|---|---|
| `jsdom` is pinned to exact `25.0.1` deliberately (reproducible SVG output can shift with jsdom serializer/DOM changes) | it's a non-caret exact pin with no comment | a maintainer note or a matching exact-pin policy across the repo |

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| Deterministic-by-default / serial-only / SVG-only contract | `packages/ssr/src/index.ts#renderToSvg` JSDoc, `packages/ssr/README.md` |
| jsdom shims are intentional (getBBox/transform.baseVal/d3-zoom extent) | root `CLAUDE.md#Gotchas`, `packages/core/CLAUDE.md`, `packages/canvas/CLAUDE.md` |
| didi last-wins + boot-order invariants | root `CLAUDE.md`, root `PLAT-02`/`PLAT-03`/`PLAT-06` |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
