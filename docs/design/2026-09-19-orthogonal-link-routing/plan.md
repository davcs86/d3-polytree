# Implementation Plan: orthogonal-link-routing

**Status**: `pending`
**Created**: 2026-09-19
**Design**: [design.md](./design.md)
**Test harness**: `pnpm --filter @d3-polytree/<pkg> test [file]` (vitest; jsdom for core/editor, node default for the pure `route/` folder) — `package.json:19`, CLAUDE.md; full gate `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook` mirrors CI `.github/workflows/ci.yml`
**Total Steps**: 11
**Review**: `not-reviewed`

---

## Execution Summary

Schema first (the `pinned` attr, with a serialization-omission verification gate), then the pure
router in a new `core/src/route/` folder (no deps, fixture-tested), then the moddle glue that widens
the routing seam and delegates to it, then the reroute-trigger swap (single writer on
`commandStack.changed` via the status-neutral write path with value-based diff-skip), then the
`link.pin` command + its user affordance, then the test/fixture updates and the architecture-guard.
Order keeps the tree building and green between steps: the pure module and schema land before the glue
that imports them; the status-neutral write path lands before the trigger that depends on it; tests that
assert new behavior land with the step that creates it. Solved waypoints stay derived; only the `pinned`
flag is authored.

## Step Dependencies

- Step 3 (widen seam / delegate to router) requires Step 1 (`pinned` schema) and Step 2 (pure router).
- Step 4 (load path) requires Step 3.
- Step 6 (trigger swap) requires Step 5 (status-neutral write path) and Step 3.
- Step 7 (`link.pin` command) requires Step 1.
- Step 8 (pin user affordance) requires Step 7.
- Step 9 (round-trip + reroute tests) requires Steps 3–7.
- Step 10 (re-derive model.test fixture) requires Step 3.
- Step 11 (architecture-guard test) requires Step 6.
- Steps 1 and 2 are independent and may be done in either order.

---

### Step 1 — Add `pinned` attribute to `pfdn:Link` (schema) + verify/guarantee default omission

**Status**: `pending`
**Files**:
- `packages/pfdn-moddle/src/pfdn.json` — modify
- `packages/pfdn-moddle/src/pfdn-moddle.test.ts` — modify

**Evidence**:
- `pfdn:Link` block: `packages/pfdn-moddle/src/pfdn.json:341-402` (properties incl. `waypoint` isMany Coordinates `:382-389`).
- Precedent to mirror — a Boolean `isAttr` default `false`: `Label.isReadOnly` at `pfdn.json:203-208`.
- Links inherit `status` (Real, default 0) from `Statusable` — `pfdn.json:9-16` (no own `status` on Link).
- moddle round-trip test to extend: `packages/pfdn-moddle/src/pfdn-moddle.test.ts:18` (`round-trips a diagram through toXML → fromXML`).

**Instructions**:
Add to the `pfdn:Link` `properties` array a `{ "name": "pinned", "isAttr": true, "type": "Boolean", "default": false }` entry, mirroring `Label.isReadOnly` (`pfdn.json:203-208`). Then **verify the moddle-xml Writer omits default-valued attrs**: after `pnpm install`, add a pfdn-moddle test that builds a `pfdn:Link` with `pinned` left default and asserts `toXML(...)` output does **not** contain `pinned`, and a second link with `pinned:true` asserts it **does** contain `pinned="true"`. **Fallback (only if the omission assertion fails):** remove `"default": false` from the attr (declare it with no default), and rely on `link.get('pinned') === true` at every read site (Steps 3, 4, 6) so absent ⇒ unpinned; keep both assertions. Do not add a custom `serialize` directive.

**Verification**:
`pnpm --filter @d3-polytree/pfdn-moddle test` (green, incl. the new omission assertions) and `pnpm --filter @d3-polytree/pfdn-moddle typecheck`. Lint: `pnpm lint`.

**Test**:
`packages/pfdn-moddle/src/pfdn-moddle.test.ts` — new cases: unpinned link `toXML` has no `pinned` attr; pinned link `toXML` has `pinned="true"`; fromXML(toXML) preserves `pinned`. Fails before the attr exists (no `pinned` round-trips), passes after.

---

### Step 2 — Pure obstacle-nudge router in `packages/core/src/route/`

**Status**: `pending`
**Files**:
- `packages/core/src/route/index.ts` — create
- `packages/core/src/route/route.ts` — create
- `packages/core/src/route/types.ts` — create
- `packages/core/src/route/route.test.ts` — create

**Evidence**:
- No `packages/core/src/route/` exists yet (**Not found** — created from scratch).
- Pure fixture-test style to mirror: `packages/layout/src/layout.test.ts:8-21,31` (`overlaps`/`assertNoOverlaps`, numeric `expect(...).toEqual(...)`).
- Existing elbow geometry to port/reuse as the pre-nudge base + give-up fallback: `packages/core/src/modelling/linkRouting.ts:247-281`; side/quadrant helpers `:53,77,136,169`; the `acos` key `:45,49`; tunables `:40,42`.
- Determinism hard rule (applies voluntarily here): `packages/layout/CLAUDE.md:16-19`.

**Instructions**:
Create a pure, dependency-free module (no moddle/DOM/DI/D3 imports). Define plain types in `types.ts`:
`Box = { x: number; y: number; size: number }`, `Point = { x: number; y: number }`, and a
`routeSegment`/`nudge` API operating on numbers only. Port the elbow computation and side/port
ordering from `linkRouting.ts:247-281,53,77,136,169` into pure functions here (input: source box,
target box, sibling connectors, obstacle boxes; output: `Point[]`). Add the **obstacle-nudge post-pass**:
for each orthogonal segment, test against every obstacle AABB except the two endpoint boxes; on
intersection shift the shared mid bend past the box edge + margin. Bound it: at most `K = 8` attempts
per segment; single left-to-right pass over the ≤3 segments; on exhaustion **give up** and emit the
un-nudged elbow. Determinism: iterate obstacles as an **id-sorted array**; total tie-break order
`(quantize(|displacement|), sign, quantize(obstacle.x), quantize(obstacle.y), obstacleId)`; no
`Math.random`/`Date`/Set/Map-iteration order. Add a **NaN guard** to the `acos` key (return a stable
sentinel order when a vector is zero-length or the cosine grazes ±1). No object identity in comparisons.

**Verification**:
`pnpm --filter @d3-polytree/core exec vitest run src/route/route.test.ts` green; `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`.

**Test**:
`packages/core/src/route/route.test.ts` (mirror `layout.test.ts` fixtures): (a) no obstacle → output equals the plain elbow (degradation invariant); (b) one interposed box → segment avoids it (no AABB intersection); (c) determinism — `route(input)` deep-equals a second call and is invariant to input obstacle ordering; (d) unsatisfiable corridor → returns the un-nudged elbow (give-up, no throw, terminates); (e) degenerate coincident points → no NaN in output. Fails before the module exists.

---

### Step 3 — Widen the routing seam and delegate obstacle handling to `route/`

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/linkRouting.ts` — modify

**Evidence**:
- Current signatures (no nodes param): `computeLinkWaypoints(link, allLinks, moddle)` — `linkRouting.ts:218-222`; `routeLinks(links, moddle)` — `linkRouting.ts:292`.
- Waypoint construction to reuse: `moddle.create('pfdn:Coordinates', {x,y})` — `linkRouting.ts:209-210`.
- `acos` key needing the NaN guard at the glue level too: `linkRouting.ts:45,49`.

**Instructions**:
Widen to `computeLinkWaypoints(link, allLinks, nodes, moddle)` and `routeLinks(links, nodes, moddle)`.
Read `node.position`/`node.size` off `nodes` to build the obstacle `Box[]` (excluding the link's own two
endpoints), call the pure `route/` module, and wrap results back into `pfdn:Coordinates` via the existing
`createWaypoint`/`moddle.create` (`:209-210`). In `routeLinks`, **skip links whose `pinned` is true**
(`link.get('pinned') === true`) — leave their stored `link.waypoint` untouched. Keep `computeLinkWaypoints`
returning `Point[] | null` (null on torn links, unchanged). Apply the NaN guard from Step 2 to the shared
`calculateAngle`. Solved (non-pinned) waypoints remain fully recomputed each call (derived).

**Verification**:
`pnpm --filter @d3-polytree/core typecheck` (callers updated in Steps 4/6 in the same change set — see Step Dependencies); `pnpm lint`.

**Test**:
Covered by Step 2 (pure geometry) and Steps 9–10 (integration + fixture). No standalone test for the glue signature; the type checker + callers are the guard. `N/A (signature change verified by typecheck + downstream steps)`.

---

### Step 4 — Load-time routing passes node obstacles and skips pinned links

**Status**: `pending`
**Files**:
- `packages/core/src/model/model.ts` — modify

**Evidence**:
- `loadModel` and the `routeLinks` call: `model.ts:54,63` (`routeLinks(definitions.link as ..., moddle)`), with `definitions` (root `pfdn:Diagram`) in scope so `definitions.node` is reachable.
- viewer/interactive-viewer boot no command stack — `packages/viewer/src/index.ts:45-50`, `packages/interactive-viewer/src/index.ts:36-48` — so this load-time call is their ONLY router (must skip pinned).
- Boot latch suppresses `commandStack.changed` during load — `CommandStack.ts:45,51,161` (no double-fire with the trigger from Step 6).

**Instructions**:
Change the call at `model.ts:63` to `routeLinks(definitions.link as ..., definitions.node as ..., moddle)`.
Pinned-skip is enforced inside `routeLinks` (Step 3), so pinned links loaded from a saved document keep
their authored waypoints on first paint in every tier (viewer/interactive-viewer/editor/ssr).

**Verification**:
`pnpm --filter @d3-polytree/core typecheck`; `pnpm --filter @d3-polytree/core exec vitest run src/model/model.test.ts` (after Step 10 re-derives the fixture); `pnpm lint`.

**Test**:
Extend `packages/core/src/model/model.test.ts`: a loaded document with a `pinned` link retains its exact
stored waypoints (not recomputed). Fails before Step 3's skip; passes after.

---

### Step 5 — Route the reroute write through status-neutral `updateElement` with value-based diff-skip

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/Links.ts` — modify

**Evidence**:
- `_updateLink` currently writes `link.waypoint` then calls `reconcile(...)` — `Links.ts:114,124-125`.
- `reconcile` → `_builder` flips `status` 0→2 — `BaseElement.ts:60-66` (flip `:63-64`); status-neutral path is `updateElement` (emits `<class>.updated`) — `BaseElement.ts:124,133`.
- Links can be `status:0` (inherited `Statusable`, `pfdn.json:9-16`) → flip would add `status="2"` residue.

**Instructions**:
Add a reroute routine (or adapt `_updateLink`) that recomputes a link's waypoints via the widened
`computeLinkWaypoints` (Step 3), and **only when they differ** from the link's current `waypoint`
writes them and calls the status-neutral `drawingRegistry`/`BaseElement.updateElement` (`:124`) —
**not** `reconcile`. Diff-skip is **value-based**: unequal length, else any `x !== x || y !== y` per
waypoint (never object identity — `createWaypoint` mints fresh objects). Skip pinned links.

**Verification**:
`pnpm --filter @d3-polytree/core typecheck`; targeted `pnpm --filter @d3-polytree/core exec vitest run src/modelling/links.test.ts`; `pnpm lint`.

**Test**:
Covered by Step 9 (status="0" round-trip proves no status residue) and Step 11 (guard). `N/A (behavioral change asserted in Steps 9 & 11)`.

---

### Step 6 — Swap the reroute trigger to `commandStack.changed` (single writer, reroute-all-unpinned)

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/Links.ts` — modify
- `packages/core/src/modelling/commands.ts` — modify (comment only)

**Evidence**:
- Current subscriptions to remove: `Links.ts:51-53` (`node.moved`, `node.updated` → `updateNodeLinks`).
- `create()`'s direct incident reroute to retire: `Links.ts:78-79`.
- Trigger event (typed, once per top-level txn, symmetric execute/undo/redo): `CommandStack.ts:201-203`; typed at `packages/canvas/src/events.ts:103`. `eventBus` already injected into `ModellingLinks` (`Links.ts:22-30`) — no `$inject` change.
- Stale comment to update: `commands.ts:224-230,240` ("the live router which subscribes to `node.updated`").

**Instructions**:
Replace the `node.moved`/`node.updated` subscriptions (`Links.ts:51-53`) with one
`this._eventBus.on('commandStack.changed', ...)` handler that iterates all links (`this._links.getAll()`)
and reroutes every **unpinned** one via the Step-5 status-neutral + diff-skip path. Remove `create()`'s
direct `updateNodeLinks(...)` calls (`Links.ts:78-79`) — the post-command pass now covers create (the
create runs inside `element.create`, which fires `commandStack.changed`). Update the now-false comment at
`commands.ts:224-230,240` to describe the `commandStack.changed` single-writer reroute. Do **not** add a
`node.updated` fallback (the only off-stack reconcile is the `@deprecated Modelling.doAction`).

**Verification**:
`pnpm --filter @d3-polytree/core exec vitest run src/modelling/links.test.ts` (after Step 9 updates it); a test asserting exactly ONE reroute pass per `element.move` and per `element.create` (Step 9); `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`.

**Test**:
See Step 9 (one-pass assertion + auto-layout single-pass) and Step 11 (off-stack guard). Covered there.

---

### Step 7 — `link.pin` command (writes only `pinned`, no reconcile)

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/commands.ts` — modify

**Evidence**:
- Command registration block: `registerModellingCommands` `commands.ts:255`, existing registrations `:260-273`.
- CommandHandler interface (`execute`/`revert`): `packages/core/src/command/CommandHandler.ts:27-38`.
- `element.move`'s "links NOT in memento / derived" precedent: `commands.ts:224-230`.

**Instructions**:
Register a `link.pin` handler in `registerModellingCommands` (`commands.ts:260-273`). Context
`{ definition, before: boolean, after: boolean }`; `execute` sets `definition.pinned = ctx.after`,
`revert` sets `ctx.before`. It writes **only** `pinned` and performs **no** `reconcile`/`updateElement`
(the polyline is visually unchanged on pin), so no status flip and no `toXML` residue. Solved waypoints
are never captured; on unpin the next `commandStack.changed` pass recomputes them.

**Verification**:
`pnpm --filter @d3-polytree/core exec vitest run src/command/CommandStack.test.ts src/modelling`; `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`.

**Test**:
Core test: execute `link.pin` then `undo` restores `pinned`; a pinned link is skipped by the reroute
pass (waypoints unchanged after an incident node move). Fails before the command exists.

---

### Step 8 — User affordance to pin/unpin a link (editor API + properties-panel control)

**Status**: `pending`
**Files**:
- `packages/editor/src/index.ts` — modify
- `packages/editor/src/properties-panel/PfdnPropertiesProvider.ts` — modify
- `packages/editor/src/properties-panel/EntryFactory.ts` — modify (only if no checkbox entry exists)

**Evidence**:
- Editor public-method precedent (C3): `editor.autoLayout()` — `packages/core/src/features/autoLayout.ts` surface; editor module wiring `packages/editor/src/index.ts:61`.
- Link properties group + entry factory: `PfdnPropertiesProvider.ts:79-82` (link group entries: `lineWidth`, `lineColor`); `EntryFactory` textField/colorPicker precedent (`EntryFactory.ts:72` emits `PropertiesPanel.propertyChanged`).
- Command dispatch precedent: `PropertiesPanel.ts:210` (`commandStack.execute(...)`).

**Instructions**:
Add `editor.pinLink(id, pinned = true)` / a thin wrapper dispatching `commandStack.execute('link.pin', {definition, before, after})`. In the link properties group (`PfdnPropertiesProvider.ts:79-82`) add a
"Pinned" boolean control. **Discovery within this step:** confirm whether `EntryFactory` already exposes
a checkbox/boolean entry; if not, add one mirroring `textField` (`EntryFactory.ts`). Wire the control to
dispatch `link.pin` (NOT `element.updateProperties`, which would `reconcile` the link and flip a status=0
link — the exact residue Step 5/7 avoid). Keep the control read/write of `definition.pinned`.

**Verification**:
`pnpm --filter @d3-polytree/editor typecheck`; `pnpm --filter @d3-polytree/editor test`; `pnpm lint`; manual: in Storybook the editor's link properties show a Pinned toggle; toggling it pins/unpins and survives undo/redo.

**Test**:
`packages/editor/src/` panel test: toggling the Pinned control dispatches `link.pin` and the link's
`pinned` flips; the link's `toXML` shows `pinned="true"` when on. Fails before the control is wired.

---

### Step 9 — Round-trip + reroute integration tests (byte-identity, one-pass, mixed pin)

**Status**: `pending`
**Files**:
- `packages/editor/src/command.roundtrip.test.ts` — modify
- `packages/core/src/modelling/links.test.ts` — modify

**Evidence**:
- Round-trip harness (`assertGestureRoundTrip`, byte-identical export): `command.roundtrip.test.ts:18-24,168-184` (`expect(editor.exportDiagram()).toBe(before)`).
- `links.test.ts` currently emits `node.moved` to drive reroute (`:128`, assertion `:132`) — must move to a command-driven trigger under Step 6.

**Instructions**:
Add: (a) a **status="0"** fixture link (loaded from XML, not `element.create` which mints status=1),
pin it via `link.pin`, undo, assert `exportDiagram()` byte-identical — proves no status residue
(Step 5/7). (b) An **obstacle** case: moving a node into a non-incident link's path reroutes that link
(post-command pass), and undo restores byte-identical XML. (c) A **mixed** case: with two unpinned
incident links, pin one → assert the other's waypoints unchanged; unpin → recomputed to the all-unpinned
baseline. (d) A **one-pass** assertion: spy `link.updated` count for a single `element.move` and for
`element.create`, and for auto-layout's single `element.move` over all nodes → one reroute pass (diff-skip
bounds emissions to changed links). Update `links.test.ts:128` to trigger via a command (or the
`commandStack.changed` event) instead of the retired `node.moved`.

**Verification**:
`pnpm --filter @d3-polytree/editor test` and `pnpm --filter @d3-polytree/core exec vitest run src/modelling/links.test.ts` green; `pnpm lint`.

**Test**:
This step *is* the test set. Each case fails against the pre-C4 tree (no pinned attr / node.moved trigger)
and passes after Steps 1–7.

---

### Step 10 — Re-derive the load-time waypoint fixture (and audit for grazing changes)

**Status**: `pending`
**Files**:
- `packages/core/src/model/model.test.ts` — modify

**Evidence**:
- Hard-coded docked-border expectation: `model.test.ts:72-79` (`expect(wp).toEqual([{x:135,y:115},{x:365,y:115},{x:365,y:225}])`).
- Drawer polyline test that must NOT move if the nudge truly degrades to today's output when nothing intersects: `packages/core/src/draw/Links.test.ts:41`.

**Instructions**:
Run the built router against the existing `model.test.ts` fixtures and **audit** which expected waypoint
arrays change. For a fixture with no interposed obstacle the output must be **identical** to today
(degradation invariant) — if any such fixture changes, that is a router bug, fix it in Step 2/3, do not
edit the fixture. Re-derive `model.test.ts:72-79` **only** if its layout genuinely has an interposed
obstacle; otherwise it must stay byte-identical. Confirm `draw/Links.test.ts:41` is unchanged (drawer
untouched).

**Verification**:
`pnpm --filter @d3-polytree/core exec vitest run src/model/model.test.ts src/draw/Links.test.ts` green; `pnpm lint`.

**Test**:
`model.test.ts` fixture updated (or confirmed unchanged) with a comment noting whether an obstacle
justified any change. `draw/Links.test.ts` unchanged.

---

### Step 11 — Architecture-guard test: off-stack reconcile must not leave stale links

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/links.test.ts` — modify (or a new `packages/core/src/modelling/reroute.guard.test.ts`)

**Evidence**:
- Reroute completeness depends on all mutations going through the stack (O11); the only off-stack path is `@deprecated Modelling.doAction` — `Modelling.ts:70-86`.
- Precedent for an invariant-enforcing guard: eslint `no-restricted-syntax` on `collections.add/remove` — `eslint.config.js:49-57`.

**Instructions**:
Add a test that documents+enforces the P invariant: performing a routing-input mutation through a
command (`element.move`) reroutes incident/obstacle links (positive), while asserting that the reroute
writer is the sole `commandStack.changed` subscriber for routing (so a future second writer or an
off-stack reconcile is caught). Assert that a bare off-stack node reconcile (simulating the deprecated
`doAction` path) does **not** silently leave a diagram in a state the command-driven pass would have
fixed — i.e. document that off-stack mutation is unsupported for routing and fails visibly (or is
covered by the deprecation). Keep it a focused guard, not a broad e2e.

**Verification**:
`pnpm --filter @d3-polytree/core exec vitest run src/modelling` green; `pnpm lint`; then the FULL gate `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook`.

**Test**:
This step is the guard test. It encodes the standing invariant so a later off-stack routing mutation is
caught by CI rather than shipping a silent stale-link regression.

---

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the
step number, what changed, and why._
