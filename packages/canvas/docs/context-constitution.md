# @d3-polytree/canvas — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the base SVG
surface — patterns and cross-package contracts an agent would otherwise miss. Does not restate the docs
or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/canvas**.

## Rules (`CANVAS-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **CANVAS-01** | `ElementRegistry.get()` returns a **`false` sentinel** for an unknown id — never `undefined`/`null`. Consumers handle the `RegisteredElement \| false` union (don't `=== undefined` or `?.`-chain the result). | The public contract is a `false` sentinel; an `=== undefined` check silently misses it. | `packages/canvas/src/ElementRegistry.ts#get` (`?? false`), `packages/canvas/src/ElementRegistry.test.ts` ("returns false for unknown ids") | `packages/canvas/src/ElementRegistry.ts#get` |
| **CANVAS-02** | Two layers with different rules: `rootLayer` (fixed) vs `drawingLayer` (zoom-transformed). Drawers append to `getDrawingLayer`; fixed chrome (axes, background, drag cursor) uses `getRootLayer`. | Core's zoom reparents `drawingLayer` under a zoom `<g>`; a new drawer on `getRootLayer` won't pan/zoom, and fixed chrome on `getDrawingLayer` drifts under zoom. | `packages/canvas/src/Canvas.ts#Canvas` (`_init`), `packages/core/src/features/zoom.ts` (`setDrawingLayer`), `packages/core/src/features/axes.ts`, `packages/core/src/features/backgroundColor.ts` | `packages/core/src/features/zoom.ts#setDrawingLayer` |
| **CANVAS-03** | `SequentialIdGenerator` is the deterministic-id contract `@d3-polytree/ssr` depends on — it is exported and consumed there even though nothing inside canvas uses it (**not** dead code). Changing its sequence (`node_1`, `node_2`, claim-skip) churns SSR golden files. | It is the seam behind `PLAT-06` determinism. | `packages/canvas/src/IdGenerator.ts#SequentialIdGenerator`, `packages/ssr/src/index.ts` | `packages/canvas/src/IdGenerator.ts#SequentialIdGenerator` |

## Norms (`CANVAS-*`) — defaults & asymmetry guidance

| ID | Norm | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **CANVAS-N04** | Inbound **`d3canvas.*`** command namespace vs outbound **`canvas.*`** notification namespace: core emits `d3canvas.init`/`d3canvas.destroy` after boot; canvas re-emits `canvas.init`/`canvas.destroy`. | Emitting `canvas.init` directly to "initialize" the surface is a no-op (nothing listens); renaming either half breaks the boot latch. | `packages/canvas/src/Canvas.ts#Canvas` (`_init`), `packages/core/src/Diagram.ts`, `packages/core/src/command/CommandStack.ts` | `packages/canvas/src/Canvas.ts#Canvas` |

## Gotchas & scars

- **The jsdom `transform.baseVal` → identity fallback in `getTransform` is intentional and load-bearing** (two tests guard it). Don't "fix" it as a bug. Evidence: `packages/canvas/src/Canvas.ts#getTransform` (pointer to `packages/canvas/CLAUDE.md`).
- **`ElementBuilder.create` silently no-ops when `prefix === ''`** (a dedicated test locks it in), but the *why* is unexplained — see findings open question before relying on it as an intentional "skip" signal. Evidence: `packages/canvas/src/ElementBuilder.ts#create`.

## Candidate rules (unverified)

| Candidate | Why suspected | What would confirm it |
|---|---|---|
| `getSvgString`'s xlink handling (set a temp `xlink` attr, then regex-rewrite `xlink=`→`xmlns:xlink=` and `NS\d+:href`→`xlink:href`) is a deliberate namespace fix | Looks like a fragile fork leftover; may be a real Safari/serializer workaround | A maintainer confirming the target bug, or replacing it with `setAttributeNS` and checking export still validates |

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| jsdom `transform.baseVal` → identity fallback is intentional | `packages/canvas/CLAUDE.md`; `packages/canvas/src/Canvas.ts#getTransform` |
| `EventSelection`/`EventModel` typed `any` to avoid an upward core import under d3 datum invariance | `packages/canvas/src/events.ts` (inline justification) |
| `d3-selection` is a peer dep, marked external in the build | `packages/canvas/package.json#peerDependencies`, `packages/canvas/tsup.config.ts` |
| `ElementClassName`/`MouseKind` must mirror core's `ElementClass`/`MOUSE_EVENTS` | `packages/canvas/src/events.ts` (parity note) |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
