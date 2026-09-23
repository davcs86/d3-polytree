# Recon: orthogonal-link-routing

**Created**: 2026-09-19
**Change**: C4 — replace angle/quadrant link waypoints with obstacle-avoiding orthogonal routes + stable port assignment, degrading to the current polyline when a route is pinned by the user.
**Depth**: deep
**Affected areas**: `packages/layout`, `packages/core/src/modelling` (linkRouting, Links, commands), `packages/core/src/draw/Links.ts`, `packages/core/src/features` (autoLayout/drag/resize), `packages/pfdn-moddle`.

---

## Repo Profile

pnpm 10 + Turborepo monorepo of scoped `@d3-polytree/*` TypeScript/ESM packages; strict TS; modular **D3 v7 as peer deps** (never the `d3` bundle). Layered by composition (`canvas`+`pfdn-moddle` → `core` → `viewer` → `interactive-viewer` → `editor`; `layout`/`ssr`/`icons-amazon` to the side), wired with **didi** DI (last-token-wins; boot-order = event-subscription-order). Per-package **tsup** builds (+ dart-sass for components, + UMD pass); **Vitest** (jsdom) tests; **Changesets** releases. CI (`.github/workflows/ci.yml`, Node 20): install `--frozen-lockfile` → `lint` → `typecheck` → `test` → `build` → `build-storybook`.

## Codebase Map

- **`packages/layout`** (TS, pure, no-deps)
  - Entry / exports: `packages/layout/src/index.ts:7`
  - Solver: `layout(graph, options): LayoutResult` — `packages/layout/src/layout.ts:24`
  - Output type (node placement ONLY): `LayoutResult { positions: Record<string, Point>; width; height }` — `packages/layout/src/types.ts:48`
  - Edges are input-only (ranking/ordering, never routed): `LayoutEdge { source; target }` — `packages/layout/src/types.ts:14`
  - Runner seam: `LayoutRunner { run(graph, options?): Promise<LayoutResult> }` — `packages/layout/src/runner.ts:10`; sync default `:15`; `WorkerLayoutRunner` `:35`
  - Worker protocol (transferable `Float64Array [x0,y0,…]`): `packages/layout/src/protocol.ts:6,25,50`; worker entry `worker.ts:16`
  - Internal-only dummy chains for long edges (closest analogue to bend points, never exported): `internal.ts:134`, `INode{rank,order,…}` `internal.ts:13`
  - Tests: numeric-fixture assertions (no-overlap, determinism, per-direction) — `packages/layout/src/layout.test.ts:16,112`; worker via fake in-process worker `protocol.test.ts:48`
- **`packages/core/src/modelling`** (TS)
  - **THE current router (pure seam)**: `computeLinkWaypoints(link, allLinks, moddle): Point[] | null` — `linkRouting.ts:218`; batch `routeLinks(links, moddle)` — `linkRouting.ts:292` (idempotent, overwrites every link's waypoints; rewrites hand-authored centre-to-centre)
  - Quadrant sides (0=top,1=right,2=bottom,3=left) via `setQuadrants` — `linkRouting.ts:77`; per-side spacing `adjustSidePoint` — `:169`; incident-link gather `computeSides` — `:136`; elbow geometry `:247`; tunables `SIDE_FLIP_THRESHOLD=80`,`CURVE_MIN_GAP=20` — `:40`
  - Waypoints written as `pfdn:Coordinates {x,y}` via moddle — `linkRouting.ts:209`, assigned `link.waypoint = waypoints` — `:299`
  - Handler delegates to the pure router, subscribes to node movement: `Links.ts:114` (`computeLinkWaypoints`), re-route triggers `Links.ts:52` (`node.moved`/`node.updated`), fan-out `:98`
  - Command layer: `element.move`/`element.resize` handlers + `registerModellingCommands` — `commands.ts:255-273`, registered at `Modelling.ts:63`. Documented invariant: **links are NOT in the move memento — waypoints are a pure function of node positions** — `commands.ts:225,231`
- **`packages/core/src/draw/Links.ts`** — renders `link.waypoint[]` as a straight polyline `M x y, L x y` — `draw/Links.ts:10`; two stacked paths + `marker-end` — `:45`; links drawn behind nodes (`.insert('g', '.node-group')`) — `:98`
- **`packages/core/src/features`** — auto-layout commits ONE `element.move` (`autoLayout.ts:60`, injectable `layoutRunner` token `:142`, `$inject` `:31`); `drag.ts` commits `element.move` (`:126`), also flips node `status` 0→2 and moves the associated `pfdn:Label` (`:153`,`:86`); `resizeElement.ts` commits `element.resize` writing size+position (`:83`). None writes `link.waypoint` directly — reroute is indirect via `node.updated`.
- **`packages/pfdn-moddle`** — `pfdn:Link.waypoint` isMany `pfdn:Coordinates` — `pfdn.json:382-389`; `pfdn:Coordinates` = `x` Real + `y` Real only — `:86-101`; plain moddle Reader/Writer, no waypoint-specific fromXML/toXML — `PfdnModdle.ts:47,57`.

## Patterns to REUSE

- **The pure router seam** `computeLinkWaypoints` / `routeLinks` — `linkRouting.ts:218,292`: the single choke point every caller (load `model.ts:63`, create, move) funnels through. C4 routing plugs in **here**, not in a new caller.
- **The C3 auto-layout command pattern** — `autoLayout.ts:60`: build items → `commandStack.execute('element.move', { items })` = one undo. C4 emits its result the same way (DN-2).
- **Injectable runner token** (`layoutRunner: ['value', …]`, last-def-wins swap) — `autoLayout.ts:142`: the precedent for hosting a solver in a Worker; a C4 router runner would mirror it.
- **moddle waypoint creation** `moddle.create('pfdn:Coordinates', {x,y})` — `linkRouting.ts:209`: reuse, don't reinvent the point type.
- **Round-trip harness** `packages/editor/src/command.roundtrip.test.ts` (snapshot toXML → gesture → undo → assert byte-identical, incl. incident-link waypoints `:168`): extend this for C4.

## Host Conventions & Hard Rules

- **Hard rule** (layout package purity): "**No DOM, no D3, no deps** — keep it that way" — `packages/layout/CLAUDE.md:8`
- **Hard rule** (layout axis discipline): "Add algorithm code in rank/order terms, never in x/y — that is what keeps all four directions on one code path." — `packages/layout/CLAUDE.md:9-11`
- **Hard rule** (determinism): "Determinism is a contract. … do not introduce `Math.random`, `Date`, or Set/Map iteration-order assumptions that could vary." — `packages/layout/CLAUDE.md:16-19`
- **Hard rule** (mutation routing): model-collection mutations must go through a registered commandStack handler — eslint `no-restricted-syntax` on `collections.add/remove` in `packages/core/src/**` — `eslint.config.js:54-55`
- **Hard rule** (totality gate): "`execute → revert` must restore a byte-identical `moddle.toXML()`." — `ROADMAP.md:659`
- **Hard rule** (D3): "D3 slices are **peer** deps — import from the specific `d3-*` package, never a `d3` bundle." — `packages/core/CLAUDE.md:22`
- Convention (didi): last-token-wins; created-listeners before drawers — `CLAUDE.md:70,74-76`

## Dependencies

- Data / schema: `pfdn:Link.waypoint` (isMany `Coordinates{x,y}`) — `pfdn.json:382-389`. A pin flag would be a NEW attr on `pfdn:Link`. Any ports concept would be new schema or derived.
- External contracts: public `link.waypoint` shape consumed by `draw/Links.ts` and `ssr`; `LayoutRunner`/`LayoutResult` public types (`@d3-polytree/layout`). New router package/API would be a new public surface.
- Config / environment: none.
- Cross-area edges: layout (positions) → core router (waypoints) → draw (polyline) → ssr; commandStack ↔ modelling; drag/resize/autoLayout → `element.move` → `node.updated` → router.

## Risks / Not-found

- **No obstacle/collision avoidance anywhere today** (`## Not found` in core recon) — C4 introduces it from scratch.
- **No node "ports"/anchor model** — "sides" are transient quadrants computed at route time (`linkRouting.ts:77`); stable port ordering must be introduced (derived or stored).
- **No pin/manual/locked flag** on link or waypoint — C4 requirement (b) "degrade to polyline when pinned" has **no existing seam**; candidate: boolean attr on `pfdn:Link` honored by `routeLinks`/`updateNodeLinks`.
- **layout package purity vs a router** — obstacle-avoiding routing is inherently x/y geometry, which the layout CLAUDE.md hard rules (`:8-11`) forbid inside that package. Where the router lives is the central architectural fork (new pure package vs extend core `linkRouting.ts`).
- **Command memento assumption** — `element.move` excludes links because waypoints are a pure function of node positions (`commands.ts:225`). Pinned (user-authored) waypoints are NOT a pure function of positions → they must survive undo/redo, which changes that assumption.
- **Ledger trap** (2026-09-17, command-stack): a gesture writes more serialized props than the obvious one; enumerate the complete serialized write set or `toXML` residue survives.
- **Ledger trap** (2026-09-18, deterministic-ids): a `['type', X]` didi service whose constructor gains any arg MUST declare `static readonly $inject`.
- **Ledger trap** (2026-09-17, command-stack): derived state with a pure producer should be recomputed on inverse/replay, not captured — keeps it byte-identical and avoids a two-writer race. (Directly relevant: solved waypoints stay derived; only _pinned_ waypoints become authored state.)

## Recommended Scope

Introduce obstacle-avoiding orthogonal routing + stable port assignment behind the existing pure `computeLinkWaypoints`/`routeLinks` seam (reuse, don't add a new caller). Add a per-link pin flag to `pfdn:Link` so a user-pinned route degrades to its stored polyline and is skipped by the router; pinned waypoints become authored model state that must round-trip and survive undo (revisit the `element.move` links-excluded memento only for pinned links). Keep solved waypoints derived/recomputed (never captured). Emit any explicit re-route as one `element.*` command (reuse the C3 pattern). Decide in the debate WHERE the pure router lives (new `@d3-polytree/route` package mirroring `layout` vs. extend core `linkRouting.ts`) given the layout package's no-x/y purity rule.
