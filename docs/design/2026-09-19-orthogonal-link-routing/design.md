# Design: orthogonal-link-routing

**Created**: 2026-09-19
**Depth**: deep
**Rounds**: 6 (panel + 5 adversarial rounds; termination: approved at the round cap)
**Approved by**: user @ 2026-09-19
**Grounded in**: recon.md

---

## Chosen Approach

C4 adds obstacle-avoiding orthogonal link routing + stable port assignment, degrading to the stored
polyline when a user pins a route. The change slots entirely behind the existing pure routing seam;
it adds **no new package** and touches no D3/DOM in the pure layer.

**1. Pure router — `packages/core/src/route/` (new sub-folder in `core`, not a package, not `layout`).**
Obstacle-avoiding routing is inherently x/y geometry, which the layout package's hard rules forbid
("No DOM, no D3, no deps" and "Add algorithm code in rank/order terms, never in x/y" —
`packages/layout/CLAUDE.md:8-11`), so it cannot live in `@d3-polytree/layout`. A separate published
package (`@d3-polytree/route`) was rejected as over-build (DN-7) — no worker-offload or
ssr-without-core need is demonstrated. Instead the numeric router is a pure, deterministic,
side-effect-free sub-folder of `core` (no moddle/DOM/DI; no `Math.random`/`Date`/Map-order), mirroring
the fixture-test style of `packages/layout/src/layout.test.ts`. The algorithm is a **per-segment
obstacle nudge** over the existing elbow geometry (`packages/core/src/modelling/linkRouting.ts:247-281`):
for each orthogonal segment, test it against every *other* node's AABB; on intersection, shift the
shared mid-channel bend past the box edge + margin. It is **bounded** (K attempts, cap ~8, then a
**give-up floor** that emits the un-nudged elbow — accept the crossing; never loops, never throws) and
**deterministic** (total tie-break order: integer-quantized |displacement|, sign, obstacle quantized
x, quantized y, node id, over a *sorted* array). It **degrades to today's exact output when no
obstacle intersects**. A real grid/visibility-graph router is the mechanical escalation behind the
same seam if a measured give-up rate ever demands a crossing-free guarantee.

**2. Seam — widen, don't add a caller.** `computeLinkWaypoints(link, allLinks, nodes, moddle)` and
`routeLinks(links, nodes, moddle)` (`linkRouting.ts:218,292`) stay the single choke point every caller
funnels through, but widen to receive the node set (obstacles). All three callers already have nodes
in scope, so there is **no `$inject` change**: `loadModel` (`model.ts:57,63`), `ModellingLinks` (already
injects `d3polytree.definitions`, `Links.ts:22-23`), and the create path. `linkRouting.ts` remains the
moddle glue: read `node.position`/`node.size`, call the pure router, write `pfdn:Coordinates` via the
existing `moddle.create` (`linkRouting.ts:209`).

**3. Reroute trigger — `commandStack.changed`, single writer (Option P).** Replace `ModellingLinks`'
`node.moved`/`node.updated` subscriptions (`Links.ts:52-53`) with one `commandStack.changed` handler
(`CommandStack.ts:201-208`) that reroutes **all unpinned** links once per top-level transaction
(symmetric on execute/undo/redo; nested executes join, so auto-layout's single `element.move` →
one pass). This is verified **complete**: every routing-input mutation is on-stack (`element.move`,
`element.resize`, `element.create`, `element.delete`, and properties-panel edits via
`element.updateProperties` — `PropertiesPanel.ts:200-216,98-103`) or boot-only (`loadModel` →
`routeLinks`, `model.ts:63`, which covers upload/localStorage/import/boot). A **diff-skip**
(value-based: equal length then `x===x && y===y` per waypoint — never object identity, since
`createWaypoint` mints fresh objects) means only genuinely-changed links call `updateElement` and emit
`link.updated`, bounding the outline/search-panel fan-out. Reroute writes waypoints via the
**status-neutral `BaseElement.updateElement`** (`BaseElement.ts:124`), **not** `reconcile` (whose
`_builder` flips `status` 0→2, `BaseElement.ts:63-64`) — so no `status` residue and the
`execute → revert` byte-identical `toXML` totality gate holds (`ROADMAP.md:659`). Solved waypoints
stay **derived** (recomputed on execute/undo/redo, never captured), preserving the links-excluded
`element.move` memento (`commands.ts:224-227`).

**4. Pin — one authored attr.** Add `pinned` (Boolean, default `false`) to `pfdn:Link`, mirroring
`Label.isReadOnly` (`pfdn.json:204-208`). Both the interactive reroute **and** the load-time
`routeLinks` skip pinned links, leaving their stored waypoints intact; the polyline drawer
(`draw/Links.ts:10`) is the unchanged degrade path. Pinned waypoints are the **only** authored routing
state. `link.pin` is a command whose memento is `{pinned}` only — it performs **no reconcile**, so no
status flip and no residue. A pinned link still occupies its port slot (stays in `computeSides`,
`linkRouting.ts:136`) but is **not** an obstacle to peers (link-vs-link avoidance is out of scope).

**5. Ports — derived, not stored.** Stable within-side ordering is a deterministic sort on peer node
id (angle tiebreak), extending the existing quadrant machinery (`linkRouting.ts:77`); no `pfdn` schema
for ports, so the `.pfdn` write set is unchanged.

**6. Determinism guard.** Guard the pre-existing `acos`-key sort (`linkRouting.ts:49,67-73`) against
`NaN` (zero-length/grazing vectors) — load-bearing for byte-identity between load and reroute.

## Rejected Alternatives

- **New published `@d3-polytree/route` package** (target-state panel) — over-build (DN-7): no
  worker-offload or ssr-without-core need demonstrated; the pure `core/src/route/` sub-folder gives the
  same separation and keeps escalation mechanical.
- **Router inside `@d3-polytree/layout`** — violates the layout package's x/y-purity hard rules
  (`packages/layout/CLAUDE.md:8-11`).
- **Incident-scoped reroute inside the move/resize handlers** (round-2 adversary alt) — reintroduces a
  correctness gap: a non-incident obstacle move, and node create/delete, would never reroute.
- **Node-event trigger (`node.created/updated/removed`) + reroute-all + diff-skip (Option Q)** — correct,
  but fires N redundant passes per N-node command; `commandStack.changed` coalesces to one pass for
  free because all mutations are command-mediated (O11).
- **Grid / A* / visibility-graph router now** — more code, state, and determinism burden than sparse
  process-flow layouts need at C4's M sizing; kept as the documented escalation behind the seam.
- **Capturing pinned waypoints in the pin memento** — unnecessary; the `pinned` flag is the only
  authored state, and derived waypoints reproduce bit-identically on undo/redo.
- **Belt-and-suspenders `node.updated` fallback for `Modelling.doAction`** — that escape hatch is
  already `@deprecated` (removed before 1.0); a fallback would restore Option Q's N-pass cost.

## Open Risks

- [ ] **Reroute cost is O(L·(L+N)) per transaction** (all unpinned links recomputed) — negligible at the
  target sparse scale; a spatial-index/dirty-set optimization is deferred to **C10**. To be recorded in
  the plan; not addressed in C4.
- [ ] **Nudge is best-effort, not crossing-free** — it gives up (emits the elbow, accepts a crossing) in
  dense corridors. Acceptable for sparse polytrees; escalate to a grid router behind the seam if a
  measured give-up rate demands it. Covered by the router's exit-criteria tests.
- [ ] **Option P depends on the O11 "all mutations through the stack" invariant** — a future off-stack
  routing-input reconcile would silently stop rerouting. Addressed by an **architecture-guard test**
  (a bare off-stack reconcile must leave no stale link) mirroring the existing `no-restricted-syntax`
  mutation rule (`eslint.config.js:49-57`). To be added in the plan.
- [ ] **moddle-xml default-attr omission unverified in this checkout** (`node_modules` not populated) —
  the byte-identical-unpinned claim rests on it. Plan step must verify against moddle-xml `dist` and, if
  it does not omit defaults, apply the fallback (declare `pinned` with no default, treat absent-as-false)
  with a test asserting an unpinned link's `toXML` has no `pinned`.
- [ ] **`create()`'s direct `updateNodeLinks` incident reroute** (`Links.ts:78-79`) must be retired/routed
  through the status-neutral path too, or created links flip status=0 peers to 2 (residue). Plan must
  extend the "one reroute pass" test to `element.create`.
- [ ] **No live link-follow during drag/resize** — unchanged from today (links snap on release); called
  out so reviewers don't read it as a regression.

## Principles & Host Rules Touched

- `DN-2` (reuse) — honored: reuse the `computeLinkWaypoints`/`routeLinks` seam, the elbow geometry, the
  C3 one-command pattern, `moddle.create('pfdn:Coordinates')`, and `commandStack.changed`; no new caller.
- `DN-7` (YAGNI) — honored: nudge over a grid router; in-core sub-folder over a new package; no worker
  seam; ports derived not stored; `link.pin` memento is flag-only.
- `DN-8` (SOLID) — honored: the pure router has one responsibility (geometry), the glue one (moddle I/O),
  `ModellingLinks` one (single reroute writer).
- `DN-9` (heuristics serve the system) — the accepted O(L·(L+N)) cost trades micro-perf for headline-feature
  correctness at target scale, with C10 as the recorded scalability path.
- Host rule "No DOM, no D3, no deps … Add algorithm code in rank/order terms, never in x/y"
  (`packages/layout/CLAUDE.md:8-11`) — honored: the router lives in `core/src/route/`, not `layout`.
- Host rule "`execute → revert` must restore a byte-identical `moddle.toXML()`" (`ROADMAP.md:659`) —
  honored: reroute uses status-neutral `updateElement`; solved waypoints derived; `link.pin` writes only
  `pinned`; determinism guarded.
- Host rule (mutation routing) — eslint `no-restricted-syntax` on `collections.add/remove`
  (`eslint.config.js:49-57`) — not breached: waypoints are blessed derived state (`commands.ts:224-227`),
  not collection mutations; the architecture-guard test enforces the broader invariant P relies on.
- Host rule "D3 slices are peer deps … never a `d3` bundle" (`packages/core/CLAUDE.md:22`) — not engaged;
  `route/` is pure geometry.

## Waivers

None. No `DN-*` objection was waived; all were resolved in the design or carried as recorded open risks.
