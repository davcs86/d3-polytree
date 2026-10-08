# Implementation Plan: c10-lod-zoom-out

**Status**: `pending`
**Created**: 2026-10-08
**Design**: [design.md](./design.md) (Amendment A2 to the C10 design)
**Test harness**: `pnpm test` → `turbo run test` → per-package `vitest run` (jsdom) (`package.json` scripts; `packages/core/package.json:22-26`); browser lane `pnpm --filter @d3-polytree/storybook test:e2e` → `playwright test` (`apps/storybook/package.json` `test:e2e`; `.github/workflows/visual-regression.yml`); perf lane `PERF=1 … --project=perf` (`apps/storybook/playwright.config.ts:57-69`, `.github/workflows/perf.yml`). Lint/format/typecheck: `pnpm lint`, `pnpm format:check`, `pnpm typecheck --concurrency=1` (`.github/workflows/ci.yml`; the unthrottled typecheck has a pre-existing pfdn-moddle race, predecessor plan Deviation Log). No coverage threshold declared.
**Total Steps**: 13
**Review**: `not-reviewed`

---

## Execution Summary

Order follows the approved delivery sequence (design.md "Delivery order"): **(A) spikes first** (Steps 1–2: durable, record-only Playwright spikes S0-1…S0-7 and a recorded go/no-go on the provisional constants), **(B) LOD core + exemptions + gates** (Steps 3–9: constants → per-slot state and cleanup → trigger/OFF/pass/observability → exemptions → harness kill switch → property test → Playwright gates), **(C) the pinned go/no-go for the REAL mechanism** (Step 10: perf arms, `perf-budget.json` keys, a recorded merge decision), **(D) the click/dblclick resolver as a separately reviewable step** (Steps 11–12), then **(E) docs/changesets** (Step 13). Each step leaves the tree buildable; cross-package unit tests read built `dist` (root `CLAUDE.md` Gotchas), so rebuild core before running the editor property test. Everything is DOM-only and transient: no model, schema, CSS or `styles.generated.ts` change.

## Step Dependencies

- Step 2 requires Step 1 (it records Step 1's pinned output). **Steps 3+ must not start until Step 2 records "go"**: constants (S_ON/S_OFF, cap, tolerance) and the event-hook choices derive from the spikes; a "no-go" returns to the user (DF-2).
- Step 4 requires Step 3 (constants). Step 5 requires Step 4. Step 6 requires Steps 4–5.
- Step 7 (harness kill switch) requires Step 4 (the `lod` option it reads).
- Step 8 (property test, `editor`) requires Steps 4–6 and a rebuild of core/canvas/interactive-viewer `dist`.
- Step 9 (Playwright gates) requires Steps 4–7 and a rebuilt Storybook (`pnpm build && pnpm build-storybook`; SB-02 dist-not-src).
- Step 10 (perf arms + pinned go/no-go) requires Steps 7 and 9. **The resolver (Steps 11–12) must not start until Step 10 records "go"** (design: "pinned measurement of the REAL mechanism is a merge go/no-go"; a fail returns the whole LOD arm to the user).
- Step 11 requires Step 6 (exempt set/kind store). Step 12 requires Step 11.
- Step 13 requires Steps 4–12.
- Open Risks carried: 33 ms goal fork (Step 10/13), E reconciliation and 0.16–0.20 thrash (Steps 1–2), AT discriminator manual pass (Step 13 notes), zone `getBBox` gap (follow-up, unchanged), incident-link/cap/undo-over-cap limits (documented in Step 13).

---

### Step 1 — Durable spikes `lod-spikes.spec.ts` (S0-1…S0-7, record-only)

**Status**: `pending`
**Files**:

- `apps/storybook/playwright/lod-spikes.spec.ts` — create
- `apps/storybook/playwright.config.ts` — modify
- `.github/workflows/perf.yml` — modify

**Evidence**:

- `perf` project exists only under `PERF` with `testMatch: /perf\.spec\.ts/` (`playwright.config.ts:57-65`) and the required `chromium` project ignores it via `testIgnore: /perf\.spec\.ts/` (`:54`) — both patterns must widen to a second file.
- `perf.yml` publishes only lines matching `^\[(perf|triggers|probe)\]` (`perf.yml:69`).
- Harness: `Tests/Perf Harness` (LARGE 23k) and `Tests/Culling Harness` (SMALL ≈10.6k) take args `culling`, `viewer`, `nodes` (`apps/storybook/src/perf/harness.ts:14-27`); `window.__polytreePerfViewer`/`__polytreeCullingViewer` expose `viewer.get(token)`; reusable helpers `loadStories({includeHarness:true})`, `gotoStory`, `iframeUrl` (`playwright/_support.ts`), `settled()`/`setView()` patterns (`culling.spec.ts:57,78`), `panOnce`/`measurePans`/`parkViewport` (`perf.spec.ts`).
- Throwaway spikes already run in this session (recon "Spike results", "Spike results 2") used CSS injection keyed on a container attribute at scale 0.1 and a drain emulation; they were not committed.
- Zoom events: `zoom.start`/`zoom.end` emitted unconditionally (`zoom.ts:141,149`); programmatic `setZoom` emits only `canvas.zoomed` (`zoom.ts:78-102`).

**Instructions**:
Create `lod-spikes.spec.ts` (PERF project; every spike logs `console.log('[lod-spike] <id> …json…')` and attaches JSON; **no assertions on timing**). Spikes: **S0-1** event trace — counts of `zoom.start`, `canvas.zoomed`, `zoom.end` (bus listeners installed via `viewer.get('eventBus')`) for `setInitialZoom` with/without duration, `setZoom` under `setZoomable(true)`, `zoom.to.element` zoomable and not, `mouse.wheel`, and a bare background click. **S0-2** listener order — register a `click` and `dblclick` capture listener on the container that calls `stopPropagation()` only for dblclick in one run and records-without-stopping in another: after a 1 px drag-release the container sees no click; with stop the transform is unchanged, without stop `dblclick.zoom` still zooms. **S0-3** `event.detail`/`pointerType` for Playwright click/dblclick, keyboard Enter on a focused `<g>`, `el.click()` and a CDP `Accessibility` default action (Chromium only). **S0-4** observed E — in-view node+link `<g>` count at scale 0.1 on a 1280×800 and a 3840×2160 viewport (use `page.setViewportSize` and a `nodes`-scaled harness), the CSS-simulated enter drain (300 attribute writes/frame, frame deltas) and the sync-exit task (CDP `TaskDuration`) at the 0.20 viewport. **S0-5** scale sensitivity — CSS-simulated hide-all pan p95 and in-view count at 0.16, 0.20, 0.25, plus a thrash run oscillating the scale 0.17↔0.21 for 20 gestures recording longtasks; attach a screenshot of the LOD-simulated view at 0.16/0.20 as a reviewer artefact (not a baseline). **S0-6** resolver ambiguity — fraction of 500 seeded random viewport points at 0.10/0.16 with ≥ 2 candidates within 4 px using `elementBounds` and link polyline distance from the spec. **S0-7** `content-visibility: hidden` on node/link `<g>`: computed style applies? CDP AX name/role of a sampled `<g>` unchanged? zoom-tick p95 (n ≥ 5). Widen `testMatch` to `/(perf|lod-spikes)\.spec\.ts/` and `testIgnore` to `/(perf|lod-spikes)\.spec\.ts/`; add `lod-spike` to the `perf.yml` grep alternation. Use the in-page `performance.now`/rAF only for measurement, never for any decision.

**Verification**:
`pnpm build && pnpm build-storybook && PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test lod-spikes --project=perf` prints `[lod-spike]` lines; `pnpm --filter @d3-polytree/storybook typecheck`; `pnpm lint`; `pnpm format:check`; the required lane is unaffected: `pnpm --filter @d3-polytree/storybook exec playwright test --project=chromium --list` lists no `lod-spikes`.

**Test**:
The spec is the measurement (record-only); its trace assertions that are deterministic — S0-1 event counts for the synchronous `setInitialZoom` path (`start,zoom,end` once each) and S0-2 "drag-release produces no click" — are asserted. Command: `PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test lod-spikes --project=perf`.

---

### Step 2 — Record `lod-measurements.md` and the go/no-go

**Status**: `pending`
**Files**:

- `docs/design/2026-10-07-c10-lod-zoom-out/lod-measurements.md` — create

**Evidence**:

- Predecessor precedent: `docs/design/2026-10-06-c10-spatial-index-culling-perf/measurements.md` (§1–§8) recorded PR1 numbers, trigger verdicts and decisions; design.md of this change lists spikes S0-1…S0-8 and the provisional constants (`LOD_SCALE_ON` 0.16, `LOD_SCALE_OFF` 0.20, `LOD_EXEMPT_CAP` 200, `LOD_CLICK_TOL_PX` 4, `MIN_LEGIBLE_PX` 4).
- Pinned numbers come from the `perf.yml` job summary/artefact (`perf.yml:62-80`), at least 5 pinned runs per cell where the spec records a median.

**Instructions**:
Run Step 1 in the pinned `perf.yml` container (push; ≥ 5 runs — the session cannot re-dispatch workflows, so the user pushes or re-runs) and write `lod-measurements.md` with one table per spike (pinned values, n, spread), then a **Decisions** section: (a) final S_ON/S_OFF/cap/tolerance (or "keep provisional"), (b) which hook evaluates ON (`zoom.end` + `canvas.zoomed`-outside-gesture, per design) and any path S0-1 shows is missing, (c) the dblclick/mark-and-skip viability from S0-2, (d) the pointer discriminator from S0-3, (e) E and the enter/exit task sizes from S0-4 and thrash from S0-5, (f) ambiguity from S0-6, (g) the S0-7 verdict (gates Stage 2 only). End with an explicit **Go / No-go**: **No-go** if the CSS-simulated fit-all pan p95 does not beat culling-only by at least the 2× spread safeguard on the pinned image, if S0-2/S0-3 contradict the resolver design, or if the 0.16–0.20 band thrashes; a No-go stops the plan and returns to the user (DF-2) with the "measurement + documented ceiling only" fallback.

**Verification**:
`pnpm format:check`; the file contains a `Go` or `No-go` line and every spike id S0-1…S0-7.

**Test**:
N/A (measurement record).

---

### Step 3 — LOD constants in `spatial/types.ts`

**Status**: `pending`
**Files**:

- `packages/core/src/spatial/types.ts` — modify
- `packages/core/src/spatial/spatial.test.ts` — modify

**Evidence**:

- Existing `@internal` constants `CULL_MIN_ELEMENTS`, `CULL_PAD`, `HIDE_BUDGET` live at the end of `packages/core/src/spatial/types.ts` and are re-exported by `spatial/index.ts`; `spatial.test.ts` has a "culling constants equal the measured values" test (`packages/core/src/spatial/spatial.test.ts`, last `describe`).
- Tests mock the constants with `vi.mock('../spatial/types', …)` (`packages/core/src/features/culling.test.ts:12-16`).

**Instructions**:
Append `LOD_NODE_PX = 25`, `MIN_LEGIBLE_PX = 4`, `LOD_SCALE_ON = MIN_LEGIBLE_PX / LOD_NODE_PX`, `LOD_SCALE_OFF = (MIN_LEGIBLE_PX + 1) / LOD_NODE_PX`, `LOD_EXEMPT_CAP = 200`, `LOD_CLICK_TOL_PX = 4` with `@internal` doc comments citing `lod-measurements.md` (use the values Step 2 decided). Export them through `spatial/index.ts` as the existing three are. Extend the constants test to pin them (a silent change forces a measurements update).

**Verification**:
`pnpm --filter @d3-polytree/core test src/spatial`; `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
`spatial.test.ts` constants case (fails before: constants absent).

---

### Step 4 — Per-slot kind/flags/cleanup and the `hold` predicate in `Culling`

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — modify
- `packages/core/src/features/culling.test.ts` — modify

**Evidence**:

- State arrays today: `_ids`, `_bounds`, `_nodes`, `_culled`, `_culledCount` (`culling.ts:53-57`); `_growCulled` (`:155-159`); `_onCreated(cls)` closure knows `cls` and upserts into `FlatIndex` (`:105-123`); `_onRemoved` reads only `def.id` (`:141-153`) because `.removed` can carry a bare `{id}` (ledger c2); `FlatIndex` reuses removed slots LIFO (`packages/core/src/spatial/FlatIndex.ts` `free` stack).
- `_reveal` is the only un-hide path (`:161-166`); `_frame` scan at `:258-296`; `_onZoomed` SHOW scan at `:237-251`.

**Instructions**:
Add parallel `Uint8Array`s `_kind` (1 node, 2 link, 3 label, 4 zone) and `_flags` (bit 1 SEL, 2 FOCUS, 4 FRESH), grown together with `_culled` in `_growCulled`; add `_defs`/`_els` arrays (`ModellingModelElement | null`, `DrawingSelection | null`) for the resolver. Write `_kind[slot]` in `_onCreated` from the closure `cls`, reset `_flags[slot]=0` there and assert (in code, as a guard) that a reused slot starts at 0. In `_onRemoved` clear `_kind`, `_flags`, `_defs`, `_els` for the slot **and** (as later steps add them) remove the slot from the admitted list/counter, the fresh list and `_focusSlot` — implement these clears now via a single `_clearSlotState(slot)` helper that later steps extend. Add `private _hold(slot): boolean { return this._lod && (this._kind[slot]===1||this._kind[slot]===2) && (this._flags[slot]&7)===0 }` with `_lod=false` for now; make the `_onZoomed` SHOW visit and the `_frame` scan use `inside && !this._hold(slot)` for reveal and `!inside || this._hold(slot)` for hide (behaviour identical while `_lod` is false). Extend `inspect()` slot entries with `kind`, `exempt`, `hold`.

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/culling.test.ts`; `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `culling.test.ts`: kind recorded per class; a removed id's slot is reused by a new id of a different kind and starts with `kind` of the new element and `flags 0`; `.removed` with a bare `{id}` clears state without throwing; with `_lod` forced true through a test-only `inspect`-adjacent setter (`@internal` `__setLod(true)` guarded by a leading underscore, removed again in Step 5) the hold predicate holds only node/link slots. Command: `pnpm --filter @d3-polytree/core test`.

---

### Step 5 — Trigger, synchronous exit, pass changes, observability

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — modify
- `packages/core/src/features/culling.test.ts` — modify

**Evidence**:

- `Zoom` emits `zoom.start`/`zoom.end` unconditionally (`zoom.ts:141,149`) and `canvas.zoomed` per tick when zoomable (`:100`); programmatic `setZoom` emits only `canvas.zoomed`; `setInitialZoom` without duration brackets start/zoom/end synchronously (verified in d3-zoom `zoom.js:84-96`, design Evidence). Culling is constructed after `Zoom`, so it misses the boot `start/zoom/end`.
- `_onZoomed` early-returns when `!_mayRun()` before the SHOW scan (`culling.ts:237-242`); `_mayRun()` gates on `CULL_MIN_ELEMENTS`/RO size (`:171-179`); idle attribute helper `_setIdle` (`:229-235`) writes `IDLE_ATTR` on `canvas.getContainer()`; `_viewport()` reads the persisted `settings.zoom` (`:188-212`) and can return the scale from the same fields; `_frame` budget logic `hides < HIDE_BUDGET` (`:268-286`).
- Ledger c10: idle is momentary during a tween ⇒ set `'false'` synchronously on the flip.
- Tooltip scale-threshold precedent `tooltip.ts:11,42`.

**Instructions**:
Add `_lod`, `_inGesture`, `_holdBacklog`, and subscribe to `zoom.start` (`_inGesture = true`) and `zoom.end` (`_inGesture = false`; `if (_mayRun()) _request()`); clear `_inGesture` in `_destroy`. Add a `private _scale(): number | null` reading `z.scale` with the same finite/positive check as `_viewport()`. **ON** — in `_frame` after computing `vp`: `if (!this._lod && !this._inGesture && this._lodEnabled && scale <= LOD_SCALE_ON) { this._lod = true; this._setIdle('false'); this._setLod('entering') }` (stateless; no pending flag); `canvas.zoomed` outside a gesture (`!_inGesture`) requests a frame via the existing `_markDirty`. **OFF** — at the top of `_onZoomed`, **before** the `!_mayRun()` early return: `if (this._lod && scale > LOD_SCALE_OFF) { this._lod = false; this._setLod('off') }` so the existing SHOW scan (unchanged `inside && !hold`) reveals every in-view held slot synchronously; `_frame` repeats the same check defensively and, when `!_mayRun()`/`!vp`, calls `_revealAll`, sets `_lod=false` and clears `data-pfd-lod`. In the `_frame` scan, a hide skipped by the budget on an `inside && hold` slot sets `_holdBacklog`; `data-pfd-lod` = `entering` while `_lod && _holdBacklog`, `on` when drained, `off` when `!_lod`, absent when inert (helper `_setLod` mirroring `_setIdle`, attribute `data-pfd-lod` on `canvas.getContainer()`, removed in `_destroy`); idle stays `'false'` while `_holdBacklog` (reuse the existing `backlog → _request()` path). Off-screen and held hides share the single ascending-slot `HIDE_BUDGET`. Read the `@internal` kill switch as `(d3polytree as {options?:{lod?:boolean}}).options?.lod !== false` into `_lodEnabled` (and `culling:false` already disables everything). Remove the Step-4 test setter.

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/culling.test.ts`; `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `culling.test.ts` (rAF stub, manual `zoom.start/zoom.end/canvas.zoomed` emits, mocked constants incl. `LOD_*`): ON only after `zoom.end` or a `canvas.zoomed` outside a gesture, never mid-gesture; scale already ≤ S_ON when the diagram becomes active (RO size arrives later) turns ON on the next frame; ON hides in-view node/link slots via the existing attribute in ≤ `HIDE_BUDGET` per frame and keeps `data-pfd-culling-idle="false"` and `data-pfd-lod="entering"` until drained, then `on`; labels/zones never held; panning an eligible slot into view while ON does not reveal it, an ineligible one is revealed synchronously; **synchronous exit** — emitting `canvas.zoomed` with scale > S_OFF reveals every in-view eligible slot with **no flush**, including when the diagram is below `CULL_MIN_ELEMENTS` (inert window); hysteresis between S_ON and S_OFF; `options.lod === false` and `culling:false` keep LOD off; destroy removes the attributes and listeners. Command: `pnpm --filter @d3-polytree/core test`.

---

### Step 6 — Exemptions: selection, focus, fresh

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — modify
- `packages/core/src/features/culling.test.ts` — modify

**Evidence**:

- `selection.changed` is emitted as `(prev, snapshot)` with entries `{element, definition}` (`selection.ts:13-16,51,68`); `prev` is taken after the clear (`:66`) and `deleteSelected` emits nothing (`:77-88`); `Selection` is registered before `Culling` (module order, interactive-viewer `CLAUDE.md`).
- keyboardNav focus moves call `g.focus()` then `selection.select(g, def)` (`keyboardNav.ts:216-218`); `BaseAddHandler.append` selects the created element (`palette/BaseAddHandler.ts:50`); undo of delete re-creates ids via `reconcile → appendElement` (`commands.ts:73-79`).
- Ledger c2: handlers must tolerate bare `{id}`.

**Instructions**:
Subscribe in the constructor to `selection.changed`, and add `focusin`/`focusout` listeners on `canvas.getContainer()` (removed in `_destroy`). `_onSelectionChanged(_prev, snapshot)`: collect wanted slots from `snapshot[i]?.definition?.id` through `_slots` (ignore unknown ids), mark them `F_WANT`, drop admitted slots that lack it (clear `F_SEL`), then walk wanted slots in **ascending slot order** admitting while `admitted < LOD_EXEMPT_CAP` (sticky: existing admitted are never evicted; an overflow slot is promoted when room frees); a newly admitted in-view slot is revealed through an O(1) bounds-vs-`_viewport()` test (`_showSlotIfInView`), a released slot is left to the next budgeted frame. Focus: `focusin` finds `(event.target as Element).closest('.element[element-id]')`, sets `F_FOCUS` on that slot and clears the previous one (idempotent; marks dirty only when a flag changes). Fresh: in `_onCreated`, when `_lod` is ON, set `F_FRESH` and push to `_freshList` (cap `LOD_EXEMPT_CAP`); clear all `F_FRESH` when `_onZoomed` sees a changed `(scale, tx, ty)` (`_lastView`). Extend `_clearSlotState` to remove the slot from `_selAdmitted`, `_freshList` and `_focusSlot`.

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/culling.test.ts`; typecheck; `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `culling.test.ts`: selected in-view node stays painted under ON and its outline child is not hidden; `snapshot` entries with a bare/unknown id are ignored; sticky first-N admission up to `LOD_EXEMPT_CAP` (mocked small cap) in ascending slot order, overflow promoted when room frees, no eviction by newcomers; select-all over the cap leaves exactly cap painted and LOD stays on; focus flag moves with `focusin`/`focusout` and is cleared when the focused element is removed (no blur on removal); a created element while ON is painted until the next viewport change then hidden; a **reused slot never inherits** SEL/FOCUS/FRESH (create→select→remove→create-in-same-slot). Command: `pnpm --filter @d3-polytree/core test`.

---

### Step 7 — Harness-only `lod` kill switch (story arg)

**Status**: `pending`
**Files**:

- `apps/storybook/src/perf/harness.ts` — modify
- `apps/storybook/src/CullingHarness.stories.ts` — modify
- `apps/storybook/src/PerfHarness.stories.ts` — modify

**Evidence**:

- `HarnessArgs` has `culling`, `viewer`, `nodes` (`harness.ts:14-27`); the harness coerces URL args defensively (`harness.ts:69-70`) and passes `culling` to the viewer constructor (`:73-76`); stories declare `argTypes` and default `args` (`CullingHarness.stories.ts:12-17`, `PerfHarness.stories.ts:12-17`); Storybook URL args require `argTypes` and booleans use `!true/!false` (`_support.ts` `iframeUrl`).
- `Viewer` options accept extra keys through `[key: string]: unknown` (`packages/viewer/src/index.ts:64`) and Culling reads `options` through the `d3polytree` host (`culling.ts:79-80`).

**Instructions**:
Add `lod?: boolean` to `HarnessArgs` (documented as an **`@internal` harness-only** switch — not a public option, not in READMEs), coerce like `culling`, pass `lod` through the viewer options only when it is explicitly `false`, and add `lod: { control: 'boolean' }` to both stories' `argTypes` with default `args.lod: true`. No `ViewerOptions` type change.

**Verification**:
`pnpm --filter @d3-polytree/storybook typecheck`; `pnpm build-storybook`; loading `iframe.html?id=…&args=lod:!false` yields `data-pfd-lod` absent after settle (checked by Step 9); `pnpm lint`; `pnpm format:check`.

**Test**:
Covered by Step 9's LOD-forced-off state (the arg is meaningless without a consumer); command there.

---

### Step 8 — Editor property test extension

**Status**: `pending`
**Files**:

- `packages/editor/src/culling.property.test.ts` — modify

**Evidence**:

- The existing test boots ONE `Editor` with ≥ `CULL_MIN_ELEMENTS`+200 elements, stubs rAF/RO/`getComputedStyle`, runs 12 seeded sequences of 25 ops, and `check()` asserts bounds==`elementBounds`, flag==DOM, culled⇒not in padded viewport, ≤ `HIDE_BUDGET` hides, ≤ 2 toggles/element (`packages/editor/src/culling.property.test.ts`, `check` and the `switch (roll)` over 8 cases; pan/zoom op uses scale `0.3 + rnd()*1.7`); soft delete keeps defs with `ElementStatus.Deleted`, so the test compares against drawn defs only.
- Ledger 2026-09-17: totality needs behavioural sequence tests, not a tripwire.

**Instructions**:
Extend the op table (roll range 8→13): `setInitialZoom` to a scale from `[0.12, 0.18, 0.5]` through the real d3 path (`zoom.setZoomable(true)`, `viewer.get('zoom').setInitialZoom(tx,ty,k)`; flushes rAF), a bus `node.click`/`background.click`, a `focusin` dispatch on a random drawn element's `<g>`, select via `editor.select(def)`, and (after Step 11) a pointer click at a held node's centre — leave a `TODO(step 11)` marker comment and add it there. Rewrite `check()` per design: replace "culled ⇒ not in padded viewport" with `culled == (!intersects(padded) || hold)` using `inspect().slots[i].hold`; add `data-pfd-lod` equals a hysteresis model replayed from the sequence of applied scales (`on` after a scale ≤ S_ON at gesture end, `off` after > S_OFF); labels/zones never culled in view; `exempt ⊆ (Selection snapshot ids ∪ activeElement slot ∪ fresh)` computed from `editor.get('selection')` and `document.activeElement` independently of Culling's flags; admitted ≤ cap and sticky; every in-view selected node/link up to the cap is painted; synchronous exit — immediately after a crossing above S_OFF (no flush) no in-view eligible slot carries the attribute; toggles per element per op ≤ 3. Keep the 240 s per-test timeouts.

**Verification**:
`pnpm build` then `pnpm --filter @d3-polytree/editor test src/culling.property.test.ts`; `pnpm --filter @d3-polytree/editor typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
The file is the test; run a mutation check and record it in the Deviation Log: skip the `_clearSlotState` call in `_onRemoved` (ghost exemption) ⇒ the `exempt ⊆ …` invariant fails; drop the OFF check from `_onZoomed` ⇒ the sync-exit invariant fails. Command: `pnpm --filter @d3-polytree/editor test`.

---

### Step 9 — Playwright correctness gates for LOD

**Status**: `pending`
**Files**:

- `apps/storybook/playwright/culling.spec.ts` — modify

**Evidence**:

- `wronglyCulled` (`culling.spec.ts:141`) flags any in-view oracle element carrying the attribute; `STATES` includes 0.12 and 0.5 (`:249`); `setView` uses programmatic `setZoom` (`:78`), which now arms LOD via the outside-gesture rule; `settled()` accepts `idle !== 'false'` (`:57`); G1/G2 test `:277`, G1b tween `:311`, G3 `:384`, G3 budget `:450`, G4 `:592`, G5 `:689`, G6 `:728`; the existing sync check spans two `page.evaluate` calls (`:288-292`); `gotoStory` defaults `reducedMotion:'reduce'` (`_support.ts`), so tween tests pass `{reducedMotion:'no-preference'}` as G1b already does.

**Instructions**:
Pass `lod` through `boot` (`{culling, viewer, lod}`); add `wronglyHidden`/`wronglyCulled` oracle per design: per slot `attribute ⇔ (!inside ∨ (lod ∧ eligible ∧ ¬exempt))`, with `lod` read from `data-pfd-lod` and `eligible`/`exempt` from `viewer.get('culling').inspect()` and the Selection/`activeElement`; keep the original strict rule for states booted with `lod:false` (one 0.12 state forced LOD-off preserves a faithful node/link culling oracle). Update G2 bounds (upper bound unchanged; lower bound applies to the ineligible-or-exempt subset when LOD is on). G3 allows ≤ 3 toggles per element per cycle. Add tests (both arms): **enter/exit** through the real path (`setInitialZoom` to 0.12, poll `data-pfd-lod==='on'` and idle `'true'` via `settled()`; then to 0.5 and assert the exit happened **inside the same `page.evaluate` that calls the zoom**, i.e. no in-view eligible attribute afterwards); hysteresis (0.18 sticky both ways); bounded per-frame drain (`stats.maxHides ≤ HIDE_BUDGET`, frames ≥ ⌈E/300⌉ with E from `inspect()` before the flip, `entering` keeps idle `'false'`); selection — `editor.select`/ctrl-select of cap+3 nodes leaves exactly cap painted; focus + ArrowRight nav paints the target and its ring; undo-of-delete (editor arm) stays visible then hides after a viewport change; **G4** AX (role, name) and group count equal ON vs OFF at fit-all with LOD on; **G5** `exportSVG()` byte parity ON vs OFF at 0.12; **G6** computed `display:none` on a held node's children and a held link's paths; a tween (`reducedMotion:'no-preference'`) from 0.1 to 1.2 exits LOD with no wrongly-hidden sighting.

**Verification**:
`pnpm build && pnpm build-storybook && pnpm --filter @d3-polytree/storybook exec playwright test culling.spec --project=chromium`; `pnpm --filter @d3-polytree/storybook typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
The spec is the test; mutation check recorded in the Deviation Log: temporarily make `_hold` return false for links ⇒ the LOD completeness assertion fails; temporarily skip the OFF branch in `_onZoomed` ⇒ the single-evaluate sync-exit assertion fails. Command: `pnpm --filter @d3-polytree/storybook test:e2e`.

---

### Step 10 — Perf arms and the pinned go/no-go for the real mechanism

**Status**: `pending`
**Files**:

- `apps/storybook/playwright/perf.spec.ts` — modify
- `apps/storybook/playwright/perf-budget.json` — modify
- `docs/design/2026-10-07-c10-lod-zoom-out/lod-measurements.md` — modify

**Evidence**:

- ON-arm assertion reads `budgetMs` from `perf-budget.json` and fails when the max of 5 pan p95s exceeds it (`perf.spec.ts`, the `culling on` describe); current budget 40 ms with provenance (`perf-budget.json`); helpers `bootArm`, `parkViewport`, `measurePans`, `panOnce` (`perf.spec.ts`).
- Separation safeguard: `off median − on max ≥ 2 × on-arm spread` (predecessor design §7/`measurements.md` §8); the same-build LOD-off baseline is the `lod:false` arm (Step 7).
- The 33 ms binding goal vs the measured hide-all floor (≈ 50–83 ms local, unpinned) is a user fork (design "Stated plainly").

**Instructions**:
Add to `perf.spec.ts`: a **fit-all pan arm** (LARGE fixture, interactive, `lod:true` vs `lod:false` in the same spec, `setInitialZoom(-50,-30,0.1)`, wait `data-pfd-lod==='on'`/idle, `panOnce` ×5 each, log `[perf] arm=lod …` / `arm=nolod …`) and a **crossing arm** (zoom 1 → 0.1 → 1 through `setInitialZoom`, recording `PerformanceObserver('longtask')` max duration and max rAF delta for the enter drain and the synchronous exit, log `[perf] crossing …`). Extend `perf-budget.json` with sibling objects `fitAllPan` and `lodCrossing`, each `{ metric, budgetMs: null, provenance }` — `null` = record-only until set. After ≥ 5 pinned runs (user pushes/re-runs), compute `fitAllPan.budgetMs` = ceil-to-frame(1.5 × max LOD p95) provided `nolod median − lod max ≥ 2 × lod spread`, and a `lodCrossing.budgetMs` regression ceiling; make the spec assert both when non-null. **Record in `lod-measurements.md` a Go/No-go for merging the LOD arm**: if the separation safeguard fails, or the pinned fit-all LOD p95 is not at least 2× better than no-LOD, stop and return to the user with the fallback (“measurement + documented ceiling only”). State the 33 ms fork plainly with the pinned numbers (accept a measured budget, or fund Stage 2); do **not** set a budget silently.

**Verification**:
`PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test perf --project=perf -g "fit-all|crossing"` prints the `[perf]` lines; the `perf.yml` job passes with the new arms; `pnpm lint`; `pnpm format:check`.

**Test**:
With non-null budgets the spec asserts them; verify it fails against the `lod:false` arm (budget below its p95 by construction of the separation rule) by temporarily pointing the assertion at the baseline arm and recording the outcome in the Deviation Log. Command: `PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --project=perf`.

---

### Step 11 — Click/dblclick resolver (`_onPointer`) with mark-and-skip

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — modify
- `packages/core/src/features/zoom.ts` — modify
- `packages/core/src/features/culling.test.ts` — modify
- `packages/core/src/features/zoom.test.ts` — modify

**Evidence**:

- `background.click` is emitted from `drawingLayer.on('click', …)` when `target.closest('.element, .element-outline')` is null (`zoom.ts:151-162`); d3-zoom binds `dblclick.zoom` on the outer drawing layer (`zoom.ts:164`, d3-zoom `zoom.js:77`); d3-drag's `yesdrag` installs `click.drag` on `window` in capture to suppress post-drag clicks (`d3-drag nodrag.js`, `d3-zoom zoom.js:295-300`) — a **container capture** listener runs below it and above the root-layer bubble handlers; touch double-tap calls the handler directly (`zoom.js:386-392`) and bypasses the DOM event.
- Bus click shape `(element, definition, DOMEvent)` from `mouseEvents.ts:46-50`; `Selection._selectElement` reads `ctrlKey`/`metaKey` off the event (`selection.ts:61`) and listens to `${cls}.click` (`:105`).
- Hit data: `FlatIndex.scan(rect, visit)` ascending slots (`FlatIndex.ts`), link waypoints via the datum with direct property reads (ledger 2026-09-20), `d3.pointer` + persisted `(p − t)/s` as in `AddLinkTool` (`palette/AddLinkTool.ts:98`); link tool marks the root layer `cursor-add-link` (`AddLinkTool.ts:51`); `AddLinkTool` listens to `node.click` (`:64`).
- Bare `emit(`${cls}.click`)` is only weakly type-enforced (ledger 2026-09-18).

**Instructions**:
In `zoom.ts` add an exported module-level `const resolvedEvents = new WeakSet<Event>()` (internal helper `markResolved(e)`) and, at the top of the `drawingLayer.on('click', …)` handler, `if (resolvedEvents.has(event)) return;` (so a resolver-handled click never emits `background.click`; d3's own `dblclick.zoom` is untouched). In `culling.ts` register `canvas.getContainer().addEventListener('click'|'dblclick', this._onPointer, true)` (removed in `_destroy`). `_onPointer(event: MouseEvent)`: return unless `this._lod && this._mayRun()`; return if the root layer has class `cursor-add-link`; return unless `event.detail > 0` and (when `event instanceof PointerEvent`) `pointerType` is set; return if `event.target` is not inside `canvas.getSVG().node()`; return if the target's closest `.element` is a **held** slot's `<g>` (a held slot has no hit area ⇒ synthesised) or is a visible node/label/zone/link (native wins; pick order: visible node → hidden node → visible label/zone → hidden link → native). Hit test: `const [px,py] = pointer(event, svgNode)` then world `((px − tx)/s, (py − ty)/s)` from the persisted zoom, tolerance `LOD_CLICK_TOL_PX / s`, candidates from `this._index.scan` over the tolerance box in ascending slot order restricted to `hold` slots; nodes by true-footprint containment (position/size from `_defs`), ranked by distance to centre then lowest slot; links by minimum point-to-segment distance over `_defs[slot].waypoint` (finite points only) accepting `d ≤ (lineWidth ?? 0)/2 + tol`, ranked by distance then lowest slot; no Map iteration. On a hit: `markResolved(event)` then `eventBus.emit(`${cls}.${event.type}`, this._els[slot], this._defs[slot], event)` (cast with a comment noting the weak typing); do **not** call `stopPropagation`. On a miss do nothing.

**Verification**:
`pnpm --filter @d3-polytree/core test src/features`; `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
`culling.test.ts` (jsdom; `getBoundingClientRect` is zero so client = local coordinates; mock `getSVG`/container): hit on node, hit on link within tolerance, miss, tie-break by slot, ctrl-click preserved on the emitted event, `detail:0` and a click whose target is a held `<g>` left to native dispatch, visible exempt node left native, label/zone-first pick order, link-tool guard, not-LOD and inert guards, dblclick emits `node.dblclick`, nothing calls `stopPropagation`; `zoom.test.ts`: a marked click does not emit `background.click`, an unmarked one does, and a dblclick on the root layer still changes the transform. Command: `pnpm --filter @d3-polytree/core test`.

---

### Step 12 — Resolver gates (Playwright + property test)

**Status**: `pending`
**Files**:

- `apps/storybook/playwright/culling.spec.ts` — modify
- `packages/editor/src/culling.property.test.ts` — modify

**Evidence**:

- Real-mouse patterns exist in `perf.spec.ts` (`panOnce`: `page.mouse.move/down/up`) and the interaction specs (`apps/storybook/playwright/interactions.spec.ts`); G4 AX helpers `axOf`/`groupCount` (`culling.spec.ts`); the Step-8 `TODO(step 11)` marker in the property test.
- Expected consumers: `Selection` selects on `${cls}.click` (`selection.ts:105`), the outline shows via `.selected` (`_outline.scss`).

**Instructions**:
Add Playwright cases (both arms, LOD on at 0.12): a real-mouse click at a hidden node's projected centre selects it and its outline paints (`.selected` + visible `.element-outline`) and **does not** emit `background.click`; ctrl-click adds a second; a click on a hidden link within tolerance selects it; a click on empty background clears the selection; pan-drag-release selects nothing; a dblclick on a hidden node records `node.dblclick` (bus listener) **and** zooms (transform changes, matching a visible node); clicking a visible label near a hidden node selects the label; with the add-link tool active (`cursor-add-link` class set) a click does not create a link via the resolver; keyboard Enter on a held element's `<g>` keeps native dispatch. Fill the property-test `TODO(step 11)` op: a click dispatched at a random held node's projected centre via `MouseEvent` with `detail:1` selects the brute-force-expected id (nearest-centre, lowest slot).

**Verification**:
`pnpm build && pnpm build-storybook && pnpm --filter @d3-polytree/storybook exec playwright test culling.spec --project=chromium`; `pnpm --filter @d3-polytree/editor test src/culling.property.test.ts`; typecheck; `pnpm lint`; `pnpm format:check`.

**Test**:
The specs are the tests; mutation check recorded in the Deviation Log: remove `markResolved` ⇒ the "no background.click" assertion fails; flip the pick order ⇒ the label-first case fails. Command: `pnpm --filter @d3-polytree/storybook test:e2e`.

---

### Step 13 — Docs, changesets, ledger note, ROADMAP

**Status**: `pending`
**Files**:

- `packages/core/README.md` — modify
- `packages/interactive-viewer/README.md` — modify
- `packages/editor/README.md` — modify
- `packages/viewer/README.md` — modify
- `packages/viewer/src/index.ts` — modify
- `packages/core/CLAUDE.md` — modify
- `packages/interactive-viewer/CLAUDE.md` — modify
- `packages/viewer/CLAUDE.md` — modify
- `packages/canvas/CLAUDE.md` — modify
- `apps/storybook/CLAUDE.md` — modify
- `apps/storybook/docs/context-constitution.md` — modify
- `ROADMAP.md` — modify
- `.changeset/c10-viewport-culling.md` — modify
- `.changeset/c10-lod-zoom-out.md` — create
- `docs/design/2026-10-06-c10-spatial-index-culling-perf/design.md` — modify (supersession pointer)

**Evidence**:

- Root `CLAUDE.md` "Package READMEs": a README-only edit needs a `patch` changeset for the package; cross-links absolute `/tree/main/`; document only real exports.
- Existing culling notes: core README Features row `cullingModule`, `### Spatial index` table; interactive-viewer README culling bullet and Styling note; editor README `culling?: boolean`; viewer README `culling` row and the `ViewerOptions.culling` JSDoc (`packages/viewer/src/index.ts`, the field added in PR2); `.changeset/c10-viewport-culling.md` is still pending (unreleased); ROADMAP C10 row at `ROADMAP.md:532`.
- `LOD_*` constants will be exported from the core root via `spatial/index.ts` (de-facto public surface).

**Instructions**:
Document: LOD state (name, not mode/option; `culling:false` also disables it); the container attributes `data-pfd-culling-idle` and `data-pfd-lod`; behaviour at zoom-out (nodes and links hidden, labels/zones painted, fit-all topology blank; hover/drag/resize/context menu/link-tool pick unavailable until zoomed in; click and double-click are resolved through the spatial index, touch double-tap zooms natively); selection cap and incident-link limitation; synchronous reveal on zoom-in; provisional thresholds and the diagram-with-large-nodes caveat; that a manual AT pass is outstanding. Amend the pending `c10-viewport-culling.md` to mention zoom-out LOD, and create `c10-lod-zoom-out.md`: core **minor**; interactive-viewer, editor, viewer **patch** (README/JSDoc-only edits; no CSS ⇒ `styles.generated.ts` unchanged). Update the CLAUDE.md files' culling bullets and the storybook docs (perf lane arms, `lod` harness switch), mark the ROADMAP C10 row with the shipped summary and recorded non-goals (reroute/boot/SearchPanel/Selection O(N²) untouched; 33 ms outcome as decided), and add a one-line "superseded by Amendment A2 (`../2026-10-07-c10-lod-zoom-out/design.md`) for LOD" pointer to predecessor `design.md` §3/§11.

**Verification**:
`pnpm format:check`; `pnpm changeset status`; full CI mirror: `pnpm install --frozen-lockfile && pnpm lint && pnpm format:check && pnpm typecheck --concurrency=1 && pnpm test && pnpm build && node packages/element/scripts/generate-styles.mjs && git diff --exit-code -- packages/element/src/styles.generated.ts && pnpm build-storybook` (`ci.yml`), then the e2e lane.

**Test**:
N/A (docs/changeset-only).

---

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the step number, what changed, and why._
