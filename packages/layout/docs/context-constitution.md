# @d3-polytree/layout — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the pure
Sugiyama solver — determinism enforcement, the abstract-geometry discipline, and the centre-point
contract with core. Does not restate the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/layout**.

## Rules (`LAYOUT-*`) — binding, easy-to-miss conventions

| ID            | Rule                                                                                                                                                                                                                                                                                           | Why                                                                                                                                           | Evidence                                                                                                                                                                                  | Example (canonical `path#anchor`)                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **LAYOUT-01** | Determinism is enforced by **explicit stable tie-breaks / pre-sorts** at every ordering step (`a.key - b.key \|\| a.tie`, sorted Kahn seed, sorted BFS roots, `JSON.stringify` edge keys). Never simplify to an unkeyed `.sort()`, drop the secondary key, or iterate a `Map`/`Set` for order. | Any of those reintroduce nondeterminism that the C8 visual-regression net immediately fails on (`PLAT-06`).                                   | `packages/layout/src/order.ts#reorderByMedian`, `packages/layout/src/internal.ts#assignRanks`, `packages/layout/src/internal.ts#buildInternal`, `packages/layout/src/internal.ts#edgeKey` | `packages/layout/src/order.ts#reorderByMedian`             |
| **LAYOUT-02** | All geometry stays in **abstract rank/order** until the final projection; sizes are swapped by axis **at ingest** (`sizeRank`/`sizeOrder` from width/height by `horizontalRank`), and only `layout.ts` ever mentions x/y.                                                                      | Adding x/y special-casing inside `order.ts`/`coordinates.ts` forks the four directions off the single code path and silently breaks LR/RL/BT. | `packages/layout/src/internal.ts#buildInternal`, `packages/layout/src/layout.ts#layout`                                                                                                   | `packages/layout/src/layout.ts#layout`                     |
| **LAYOUT-03** | The solver emits node **centre** points; the consumer converts to top-left (`center − size/2`, rounded).                                                                                                                                                                                       | Returning top-left, or dropping the rounding, offsets every auto-layout move by half a node.                                                  | `packages/layout/src/layout.ts#layout` (`positions[id] = centre`), `packages/core/src/features/autoLayout.ts#_buildMoveItems`                                                             | `packages/core/src/features/autoLayout.ts#_buildMoveItems` |

## Norms (`LAYOUT-*`) — defaults & asymmetry guidance

| ID             | Norm                                                                                                                                                                                                                | Why                                                                          | Evidence                                        | Example (canonical `path#anchor`)               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| **LAYOUT-N04** | Dummy nodes get coordinate weight **128** (vs real nodes' `max(1, degree)`) to force long edges straight through their dummy chain. Preserve the behavior; the constant value itself is unconfirmed (see findings). | Documented intent (straight long edges) but the magic number is unexplained. | `packages/layout/src/coordinates.ts#placeLayer` | `packages/layout/src/coordinates.ts#placeLayer` |

## Gotchas & scars

- **The separation-offset trick in `placeLayer`** (subtract a cumulative offset before `isotonic`, re-add after) turns a min-gap constraint into a plain non-decreasing one. Edit both halves together — editing one in isolation silently produces overlaps the tests only sometimes catch. Evidence: `packages/layout/src/coordinates.ts#placeLayer`.
- **Self-loops and dangling edges are silently dropped; duplicate edges are silently kept** (`valid` filter). Don't add "validation" that starts throwing on these — it's tolerated on purpose. Evidence: `packages/layout/src/internal.ts#buildInternal`.

## Candidate rules (unverified)

| Candidate                                         | Why suspected                                                                    | What would confirm it                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `WorkerLayoutRunner.run` should time out / reject | it resolves but never rejects; a worker crash leaves the promise pending forever | check whether core wraps it with a timeout (not visible in this module) |

## Pointers (already documented or CI-enforced — not restated here)

| What                                                                                  | Where                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------- |
| No DOM/D3/deps; keep it pure and Worker-hostable                                      | `packages/layout/CLAUDE.md`                 |
| Determinism is a contract (no `Math.random`/`Date`/iteration-order)                   | `packages/layout/CLAUDE.md`, root `PLAT-06` |
| Pipeline stages + Worker split (`protocol` pure, `worker` thin, `runner` main-thread) | `packages/layout/CLAUDE.md`                 |

---

_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
