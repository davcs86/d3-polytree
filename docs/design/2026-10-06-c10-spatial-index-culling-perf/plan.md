# Implementation Plan: c10-spatial-index-culling-perf

**Status**: `in-progress`
**Created**: 2026-10-07
**Design**: [design.md](./design.md)
**Test harness**: `pnpm test` → `turbo run test` → per-package `vitest run` (jsdom) (`package.json` scripts; `packages/core/package.json:22-26`; `packages/core/vitest.config.ts:1-2`); browser lane `pnpm --filter @d3-polytree/storybook test:e2e` → `playwright test` (`apps/storybook/package.json` `test:e2e`; `.github/workflows/visual-regression.yml:86,122`). Lint/format/typecheck: `pnpm lint`, `pnpm format:check`, `pnpm typecheck` (`.github/workflows/ci.yml:26,29,32`). No coverage threshold declared.
**Total Steps**: 29
**Review**: `re-review pending (A1 amendment; fixes applied 2026-10-07)`

---

## Execution Summary

Three PRs, in the design's order (design.md §11). **PR1 (steps 1–9)** is measurement only: it adds the harness-only fixture stories, the story filter, the perf/probe specs and workflow, and records the numbers that gate every "promote on trigger" mechanism and the blocking budget; it changes no published package. **PR2 (steps 10a–25; amended A1 after PR1's measurements — see the Review Log)** ships culling default-on: pure index → title refresh → export strip → option → the `Culling` feature (built up in slices) → CSS + module registration → palette fix → property/ssr tests → required correctness spec → blocking perf ceiling → docs/changesets. **PR3 (steps 26–28)** adds label LOD and finalises the ceiling. Within a PR, contracts precede consumers (index/constant before `Culling`; `Culling` before its module registration and CSS) so every step leaves the tree buildable. Cross-package unit tests read built `dist` (`CLAUDE.md` Gotchas), so rebuild an upstream package before testing a dependent one.

Conventions used throughout: "Verification" lists the repo's own commands; code steps also append `pnpm lint` and `pnpm format:check` (`ci.yml:26,29`). Paths are repo-relative. Line numbers come from the plan's discovery digests (read-only greps/reads on 2026-10-07).

## Step Dependencies

- **A1 (2026-10-07).** Step 10a (resize the correctness fixture) precedes every PR2 code step that uses `SMALL`; Step 23 requires Step 10a. The §9 contingency was invoked after PR1 and resolved by the user's A1 decisions (budgeted hide, `CULL_MIN_ELEMENTS` = 5,000, cost-based dual-pad trigger, free-list re-measure) — see design.md and the Review Log.
- Step 3 requires Step 1 (stories carry the `harness-only` tag the filter reads) and Step 2 (fixture generators).
- Step 5, 6, 7 require Step 3 (harness stories) and Step 4 (perf project/config); Step 7 additionally requires Steps 5–6 (it extends `perf.spec.ts` and reuses Step 6's temporary CSS rule).
- Step 8 requires Step 4–7 (workflow runs `PERF=1` project).
- Step 9 requires Steps 5–7 (records their numbers); **PR2 must not start until `measurements.md` exists**: `CULL_MIN_ELEMENTS`, the pad, the §9 promotion triggers and the budget/separation safeguard all derive from it.
- Step 11 (title refresh) is independent of Steps 10, 12–13.
- Step 14 requires Step 10 (index/`elementBounds`), Step 12 (marker constant) and Step 13 (`culling` option type).
- Steps 15–17 require Step 14 (slices of the same file; execute in order).
- Step 18 requires Step 14–17 (module registration + CSS + module-order tests).
- Step 19 (regenerate `styles.generated.ts`) requires Step 18 (CSS built) and must be committed with it.
- Step 20 (palette) is independent of Steps 14–19 but must land in the same PR (it fixes a bug the culling introduces).
- Step 21 (property test) requires Steps 14–18.
- Step 23 (`culling.spec.ts`) requires Steps 2, 3, 6, 10a (P1/P2/Node-import outcomes), 10, 11, 12 (G5 export strip), 13–17 (option + Culling slices), 18, 19 (built Storybook consumes built `dist` — SB-02).
- Step 24 requires Step 9 (budget data) and Step 23.
- Step 25 (docs/changesets) requires Steps 10–24.
- Step 26 requires Steps 14–18 merged (PR2). Step 27 requires Step 26. Step 28 requires Step 27.
- Step 22 (ssr) requires Step 18.
- **Contingency (design §9).** If `measurements.md` shows ANY §9 trigger fired (chunked hide, free-list, dual-pad, SHOW-as-query, Editor arm), no step in this plan builds the promoted mechanism: stop after Step 9 and return to the user to amend the design (DF-2). PR2 does not start until `measurements.md` states every trigger as "not fired" or the design is amended.
- **Design deviation, surfaced for the gate.** Design §11 puts the budget/separation verdict in PR1, but PR1 has no ON arm (Culling is built in PR2). This plan therefore collects the OFF-arm data in PR1 and decides the separation safeguard at Step 24 (blocking ceiling or return to the user).
- Step 21 (property test, `editor` package) requires Steps 14–18 and a rebuild of core/canvas/interactive-viewer `dist`.

---

## PR1 — Measure (no published-package change; no changeset)

### Step 1 — `loadStories` harness-only filter + filter spec

**Status**: `done`
**Files**:

- `apps/storybook/playwright/_support.ts` — modify
- `apps/storybook/playwright/harness-filter.spec.ts` — create

**Evidence**:

- Confirmed via digest: `_support.ts:28` `export function loadStories(): StoryEntry[] {`; `:39-42` `return Object.values(index.entries).filter((e) => e.type === 'story').map((e) => ({ id: e.id, title: e.title, name: e.name, tags: e.tags ?? [] })).sort((a, b) => a.id.localeCompare(b.id));`; `tags` already typed at `:10,:17` and mapped at `:41`.
- Callers (all no-arg): `vr.spec.ts:10`, `a11y.spec.ts:16`, `interactions.spec.ts:17` (`.find(title === 'Tests/Interaction Harness')`), `theme.spec.ts:11` (`'Components/Editor'`). `element-form.spec.ts` does not call it.
- `Tests/Interaction Harness` is tagged only `['!autodocs']` (`InteractionHarness.stories.ts:61-74`), so it is not `harness-only` and keeps its VR/a11y coverage.
- `apps/storybook/tsconfig.json` `include` covers `playwright/` so `tsc --noEmit` typechecks the spec (`apps/storybook/docs/context-constitution.md:27`).

**Instructions**:
Change the signature to `loadStories(opts: { includeHarness?: boolean } = {})` and add `.filter((e) => opts.includeHarness || !(e.tags ?? []).includes('harness-only'))` after the `type === 'story'` filter. Do NOT touch the four existing call sites (they take the default, which excludes harness stories). Create `harness-filter.spec.ts`: it reads `loadStories()` and `loadStories({ includeHarness: true })` and asserts (a) the default list contains no entry tagged `harness-only`, (b) the include-harness list is a superset, (c) every entry in the default list is also in the include list. Never use `toHaveScreenshot` in this spec (it runs in the seed-missing and compare passes, `visual-regression.yml:86-100,122`).

**Verification**:
`pnpm --filter @d3-polytree/storybook typecheck` (script `tsc --noEmit`, `apps/storybook/package.json`); after Step 3 builds the stories: `pnpm build && pnpm build-storybook && pnpm --filter @d3-polytree/storybook test:e2e harness-filter`; `pnpm lint`; `pnpm format:check`.

**Test**:
`apps/storybook/playwright/harness-filter.spec.ts` (created here). Authored to fail against the pre-change tree on `tsc --noEmit` (no `includeHarness` option); NOTE its runtime assertions are vacuous until Step 3 adds the first `harness-only` stories — the behavioural teeth (default list excludes both harness titles; include-list contains them) are asserted in Step 3. Command: `pnpm --filter @d3-polytree/storybook test:e2e` (`apps/storybook/package.json`).

---

### Step 2 — Perf/correctness fixture generators

**Status**: `done`
**Files**:

- `apps/storybook/src/perf/fixture.data.ts` — create (pure data: seeded PRNG + plain-object model spec)
- `apps/storybook/src/perf/fixture.xml.ts` — create (builds `.pfdn` XML in the browser via moddle)
- `apps/storybook/playwright/fixture.spec.ts` — create (determinism/ratio spec; see **Test**)

**Evidence**:

- **Not found** — no fixture generator and no seeded PRNG exist in the repo (digest: `apps/storybook/src/sample.ts:12-67` fixtures are literal XML; grep for `mulberry|lcg|fast-check` found none; `fast-check` is not a dependency).
- Existing pattern for programmatic model building: `moddle.create('pfdn:Node', …)` (`packages/core/src/modelling/Nodes.ts:51-55`), `emptyModel()` (`packages/core/src/model/model.ts:54-58`), `toXML` (`model.test.ts:84-87`).
- Schema facts (`packages/pfdn-moddle/src/pfdn.json`): Zone attrs `width`/`height` (default 25), `border` child with `lineWidth`/`lineColor`; Label has `position`, `text`, `fontSize` (default 13), no w/h; Node `size` default 25; Link `pinned` Boolean (`pfdn.json:~371-376`), `waypoint` isMany Coordinates.
- Existing XML shape (`sample.ts:11-24`): lowercase tags (`tagAlias: lowerCase`), `<settings><zoom><offset/><scale/></zoom><grid/></settings>`. **UNVERIFIED**: the exact XML serialization of a zone and its `border` — hence the generator emits via `moddle.create` + `toXML`, never hand-written XML.
- Determinism: `deterministicModules()` first (`apps/storybook/src/deterministic.ts:14-20`; SB-N04); no `Math.random`/`Date` (PLAT-06, `docs/context-constitution.md:29`).

**Instructions**:
(Design §8 names a single `src/perf/fixture.ts`; this plan splits it into a Node-safe data module and a browser XML builder so Playwright specs can import the data without the workspace packages — a deliberate, logged refinement.)
`fixture.data.ts` exports `mulberry32(seed)` (hand-written, ~6 lines) and `generateFixtureSpec({ nodes, links, labelRatio, zones, longRangeRatio, seed })` returning plain arrays of `{id, x, y, size}` nodes, `{id, source, target, waypoints}` links (all `pinned: true`, orthogonal waypoints), labels (`fontSize`, `text`), zones. It must have zero imports from `@d3-polytree/*` so Playwright specs can import it in Node. Defaults per design §8: 10,000 nodes, 12,000 links (1:1.2), 5% long-range (span ≥ 30% of world width), labels on 10% of nodes, ~40 zones; a `small()` preset of ~3,000 elements (must be ≥ 2× the provisional `CULL_MIN_ELEMENTS` 1000). `fixture.xml.ts` imports `createPfdnModdle`/`emptyModel` from `@d3-polytree/core` and returns `toXML` output of a model built with `moddle.create`; it also exports the same ids so specs can address `g[element-id="…"]`.

**Verification**:
`pnpm --filter @d3-polytree/storybook typecheck`; `pnpm --filter @d3-polytree/storybook test:e2e fixture` (needs `pnpm build && pnpm build-storybook` first, `loadStories` reads `storybook-static/index.json`; or run the spec with `npx playwright test --list` to confirm it is discovered); `pnpm lint`; `pnpm format:check`.

**Test**:
`apps/storybook/playwright/fixture.spec.ts` — create: imports `generateFixtureSpec` (Node-safe, no workspace imports) and asserts determinism (two calls with one seed deep-equal; a different seed differs), the node:link ratio, the long-range fraction within ±1%, every link `pinned`, unique ids, and `small()` element count ≥ 2000. Command: `pnpm --filter @d3-polytree/storybook test:e2e` (`package.json` `test:e2e`). Fails before (module missing), passes after.

---

### Step 3 — Harness stories (`harness-only`)

**Status**: `done`
**Files**:

- `apps/storybook/src/CullingHarness.stories.ts` — create
- `apps/storybook/src/PerfHarness.stories.ts` — create
- `apps/storybook/playwright/_support.ts` — modify (optional `args` on `iframeUrl`/`gotoStory`)
- `apps/storybook/playwright/harness-filter.spec.ts` — modify (behavioural teeth)

**Evidence**:

- Pattern to mirror (`apps/storybook/src/InteractionHarness.stories.ts`, 81 lines): imports `Meta, StoryObj` from `@storybook/html`, `Editor` from `@d3-polytree/editor`, `deterministicModules`, and both CSS (`'@d3-polytree/interactive-viewer/style.css'`, `'@d3-polytree/editor/style.css'`) at `:1-7`; `declare global { interface Window { __polytreeEditor?: Editor; __polytreeReady?: Promise<void>; … } }` at `:21-33`; `mount()` builds `div[data-testid=editor-host]` 820×520, `tabIndex=0`, `new Editor({ container: host, modules: deterministicModules() })`, `window.__polytreeReady = editor.importDiagram(SAMPLE_DIAGRAM)` at `:35-57`; `meta = { title: 'Tests/Interaction Harness', tags: ['!autodocs'], … }` at `:61-74`; `export const EditorHarness: StoryObj = { render: () => mount() }` at `:79-81`.
- `Viewer.get(name)` is public (`packages/viewer/src/index.ts:180`); zoom DI token is `'zoom'` (`packages/core/src/features/index.ts:78-82`); `Zoom.setInitialZoom(tX, tY, s, duration?)` (`zoom.ts:113`), `setZoom` (`:78`); zoom is non-zoomable after construction until `ZoomScroll` enables it (`zoom.ts:73-75`; `zoomScroll.ts:12`).
- SB-03: `meta.title` is a cross-file lookup key; new titles must be unique (`apps/storybook/docs/context-constitution.md:17`).

**Instructions**:
Create two stories with titles `Tests/Culling Harness` (small fixture) and `Tests/Perf Harness` (large fixture), both `tags: ['!autodocs', 'harness-only']`, both passing `deterministicModules()` FIRST in `modules`. Each parks `window.__polytreeCullingEditor` / `window.__polytreePerfViewer` plus `__…Ready` on `window`, with a `declare global` block, and exposes `get(token)` access (e.g. `window.__…Viewer.get('zoom')`). Support an arm selector through story `args` `culling` (`true`/`false`, passed as the `culling` option — it typechecks before Step 13 because `ViewerOptions` has `[key: string]: unknown` at `viewer/src/index.ts:64`, and is ignored until Step 14, which is why PR1's baseline is the "off" arm) and `viewer` (`'interactive' | 'editor'`). Playwright switches arms per load, so extend `iframeUrl(id, args?)` (`_support.ts:46-48`) and `gotoStory(page, id, media, args?)` (`:55-84`) to append `&args=key:value;key:value` to the iframe URL — booleans use Storybook's `!true`/`!false` URL encoding (`culling:!false`), so declare `culling` and `viewer` in the story's `argTypes` (undeclared URL args may be dropped) and have the story coerce defensively (`args.culling === false || args.culling === 'false'` ⇒ off), since the viewer test is `options.culling !== false` (**CONFIRMED 2026-10-07** on Storybook 8.6.18 + html-vite in Chromium, with `culling`/`viewer` declared in `argTypes`: `&args=culling:!false`, `&args=culling:false` and `&args=viewer:interactive;culling:!false` all deliver `culling === false` as a real boolean; absent ⇒ the declared default `true`. Undeclared args were not tested — keep the `argTypes` declaration. Named-export fallback only if a future Storybook bump breaks this). The `editor` arm is an `Editor` whose `getModules()` is overridden to filter the same two panel modules so the 23k fixture boots (**UNVERIFIED** that the Editor boots at 23k; if not, restrict the Editor arm to the ~3k fixture and record it in `measurements.md`). Pin the window identifiers: `window.__polytreeCullingViewer`, `window.__polytreeCullingReady`, `window.__polytreePerfViewer`, `window.__polytreePerfReady`. the interactive arm is an `InteractiveViewer` subclass overriding `getModules()` to filter out `sideTabsModule`/`searchPanelModule` **only so the 23k fixture boots** (recorded non-goal). Both import the fixture XML from Step 2 and call `importDiagram`.

**Verification**:
`pnpm build && pnpm build-storybook` (`ci.yml:38,54`); `pnpm --filter @d3-polytree/storybook typecheck`; `pnpm lint`; `pnpm format:check`; then `pnpm --filter @d3-polytree/storybook test:e2e harness-filter` still passes and the new story ids are absent from `loadStories()` and present in `loadStories({ includeHarness: true })`.

**Test**:
Extend Step 1's `harness-filter.spec.ts` with the behavioural teeth: `loadStories()` contains neither `Tests/Culling Harness` nor `Tests/Perf Harness`; `loadStories({ includeHarness: true })` contains both; the default list is otherwise unchanged versus the pre-Step-3 story set. Fails before (the harness titles are absent from the include-list). Command: `pnpm --filter @d3-polytree/storybook test:e2e` (`apps/storybook/package.json:10`).

---

### Step 4 — Playwright `perf` project and script

**Status**: `done`
**Files**:

- `apps/storybook/playwright.config.ts` — modify
- `apps/storybook/package.json` — modify (script)

**Evidence**:

- `apps/storybook/playwright.config.ts` (50 lines): `testDir: './playwright'` (`:18`), `fullyParallel: true` (`:21`), `retries: process.env.CI ? 1 : 0` (`:23`), `workers: process.env.CI ? 2 : undefined` (`:24`), `trace: 'on-first-retry'` (`:41`), no global `timeout` (only `webServer.timeout` `:48`), `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]` (`:43`).
- `snapshotPathTemplate` includes the project name (`:20`), so the `perf` project must not call `toHaveScreenshot`.
- Scripts: `test:e2e` = `playwright test` (`apps/storybook/package.json:10`; `:11-13` are `test:e2e:update-snapshots`, `:seed-missing`, `:update-a11y`; `@playwright/test` pinned `1.56.1` at `:27`); the required runs are `visual-regression.yml:86,93,99,122`.

**Instructions**:
Add `testIgnore: /perf\.spec\.ts/` to the existing `chromium` project object (`playwright.config.ts:43`) **unconditionally**. After it, add a conditional spread `...(process.env.PERF ? [{ name: 'perf', testMatch: /perf\.spec\.ts/, timeout: 180_000, retries: 0, use: { ...devices['Desktop Chrome'] } }] : [])`; when `process.env.PERF` is set also set top-level `workers: 1` and `fullyParallel: false` (compute these with the same `process.env.PERF` check). Add `"test:perf": "PERF=1 playwright test --project=perf"` to `apps/storybook/package.json`. Do not change `test:e2e*`.

**Verification**:
`pnpm --filter @d3-polytree/storybook typecheck`; `pnpm --filter @d3-polytree/storybook exec playwright test --list` lists no `perf.spec.ts` test; `PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --list --project=perf` lists it (after Step 5); `pnpm lint`; `pnpm format:check`.

**Test**:
N/A (config-only; behaviour is observed by the two `--list` runs above and exercised by Steps 5–8).

---

### Step 5 — Baseline perf spec (off arm; CDP metrics)

**Status**: `done`
**Files**:

- `apps/storybook/playwright/perf.spec.ts` — create

**Evidence**:

- **Not found** — `newCDPSession`, `Performance.getMetrics`, `ariaSnapshot` appear nowhere in the repo (digest §4). Playwright is pinned at `1.56.1` (`apps/storybook/package.json`).
- Story lookup by title via `loadStories().find` (`interactions.spec.ts:17`); wait pattern `await page.evaluate(() => window.__polytreeReady)` (`interactions.spec.ts:20-24`).
- `gotoStory` forces `reducedMotion: 'reduce'` (`_support.ts:62`) — fine for pan measurements, **not** for tween tests (Step 23).
- Pan must go through the real d3-zoom handler (zoom listens on `g.full-group`, `zoom.ts:164`); `ZoomScroll` makes the viewer zoomable (`zoomScroll.ts:12`). `Zoom.setInitialZoom` goes through the same handler (`zoom.ts:113-124,142-148`).
- `CDP TaskDuration` is main-thread only (raster/compositor excluded) — record this in the spec header.

**Instructions**:
Write `perf.spec.ts` (one arm: the interactive subclass, `culling:false`): load `Tests/Perf Harness` with `loadStories({ includeHarness: true })`, `test.setTimeout(180_000)`, wait for `__polytreePerfReady`. Open `page.context().newCDPSession(page)`, `Performance.enable`; before/after a scripted real-mouse pan (`page.mouse` down/move/up over the background — first assert `elementFromPoint` hits the background, not an element) sample `Performance.getMetrics` (`TaskDuration`, `ScriptDuration`, `LayoutDuration`, `RecalcStyleDuration`) per 10-frame batch, plus in-page rAF deltas; repeat ≥ 5 times, interleaving. Emit raw samples as `testInfo.attach('perf.json', …)` and print p50/p95/spread. Assert nothing about timing in PR1 (no budget exists yet — design §11 PR1).

**Verification**:
`pnpm build && pnpm build-storybook && PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --project=perf` produces `perf.json` attachments; `pnpm --filter @d3-polytree/storybook typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
The spec is itself the measurement. Its sanity assertions (fixture booted: element count ≥ 20,000; ≥ 10 distinct frame deltas sampled; metrics non-zero) fail on an empty/failed boot. Command: `PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --project=perf`.

---

### Step 6 — Probes P1–P4 and the bulk-attribute-write probe

**Status**: `done`
**Files**:

- `apps/storybook/playwright/culling-probes.spec.ts` — create (small fixture only; required-lane safe)

**Evidence**:

- Probes are named in design §7/§Open Risks: **P1** (does a `<g>` with `<title>` and all-`display:none` children keep its AX name), **P2** (does Chromium `getBoundingClientRect` include stroke), **P3** (`focus()` on such a `<g>`), **P4** (wheel-zoom mid-resize; whether the resize target is selected during the gesture — **UNVERIFIED**).
- DOM of one element: `g.{cls}Item.element[element-id]` with `<title>`, `<desc>`, `g.innerElement`, `rect.element-outline` (first child via `insert('rect', ':first-child')`, `outline.ts:65-66`), `rect.element-focus-ring` (last, `keyboardNav.ts:100-103`) (`BaseElement.ts:118-138`).
- **VERIFIED 2026-10-07 (throwaway probe, Chromium via Playwright 1.56.1, real Editor + SAMPLE_DIAGRAM, with the production CSS rule injected and `data-pfd-transient="culled"` on `g[element-id="node_a"]`):** (P1) CDP `Accessibility.getFullAXTree` is unchanged — total nodes 157 before and after, and the two node `<g>`s stay `role: group, name: "node (default)"` (from `<title>`), so the AT name survives; (P3) `g.focus()` on the culled `<g>` ⇒ `document.activeElement === g` (tabindex `-1`); (P2) `getBoundingClientRect` for a link path is `[230,110]`, identical to `getBBox`, and **unchanged after `stroke-width: 40`** ⇒ it does NOT include stroke; computed child display after culling: outline `rect`/`.innerElement`/focus-ring `rect` ⇒ `none`, `title`/`desc` ⇒ `inline`, culled `<g>` rect ⇒ `0×0`. **`locator.ariaSnapshot()` is NOT a faithful AX oracle here:** it returned `"- img"` for the visible `<g>` and `""` once its children were hidden, while CDP's real AX tree kept the named group — so G4 must use CDP (`Accessibility.getFullAXTree`/`getPartialAXTree`), with `ariaSnapshot` informational only. CDP `Performance.getMetrics` exposes `TaskDuration`, `ScriptDuration`, `LayoutDuration`, `RecalcStyleDuration` (plus `V8CompileDuration`, `DevToolsCommandDuration`, `TaskOtherDuration`).
- Temporary rule for probes: the same selector as the production rule — `.pfdjs-container .element[data-pfd-transient] > :not(title):not(desc) { display: none }` — injected with `page.addStyleTag`.

**Instructions**:
Set `test.setTimeout(60_000)` (the default is 30 s; this spec runs in the **required** e2e job via `chromium`, so keep it to the small ~3k fixture and move the 23k bulk-write probe to `perf.spec.ts`, Step 7). Also (a) measure, per class (node, link, label, zone), the **painted-extent overhang** — `getBoundingClientRect` converted to world units minus the raw model geometry (position/size/waypoints/width/height) — and record the max per class (this is the pad input, Step 15); and (b) keep a one-line guard that `await import('@d3-polytree/core')` and `require('@d3-polytree/core')` both succeed from a Playwright spec and expose `emptyModel` (**VERIFIED 2026-10-07**: 111 exports via both; `apps/storybook` is CJS — `_support.ts:29` uses `__dirname` — and core's CJS build resolves), so Step 23 imports `elementBounds` directly and no in-page fallback is needed.
In the small `Tests/Culling Harness` story, inject the temporary style and set `data-pfd-transient="culled"` on one node and one label `<g>`. P1: via CDP `Accessibility.getFullAXTree` (not `ariaSnapshot` — see Evidence) assert that, for the node and for the label `<g>`, the AX node's `role` and `name` are identical hidden vs unhidden and the total AX node count is unchanged (regression guard for the verified behaviour); record `ariaSnapshot()` output as informational only. P2 (already verified: stroke is NOT included): keep a recorded regression assertion that `getBoundingClientRect` is unchanged after setting `stroke-width: 40` on a link path, so G1 keeps inflating the oracle explicitly. P3: `g.focus()` on the hidden `<g>` — assert `document.activeElement` is that `<g>`. P4: start an Editor resize (`.resize-container` corner drag) and wheel-zoom mid-gesture; record whether the node is selected and whether bounds drift (record only; informational). Write all outcomes to `testInfo.attach('probes.json', …)`. P1 and P3 assertions are blocking; P2 and P4 only record.

**Verification**:
`pnpm build && pnpm build-storybook && pnpm --filter @d3-polytree/storybook test:e2e culling-probes`; typecheck/lint/format as above.

**Test**:
The spec is the test (P1/P3 assertions fail on an unexpected AX/focus outcome). (PR description note: P1/P3 are blocking assertions in the required e2e lane, so a P1 failure turns PR1's required check red by design.) P1 and P3 were verified on 2026-10-07, so the contingency below is not expected; if the regression guard ever fails, **stop**: the design's contingency (mirror `<title>` into `aria-label` on the `<g>`) triggers; record in `## Deviation Log` and bring it to the user (DF-2) before PR2.

---

### Step 7 — Microbenchmarks and trigger measurements

**Status**: `done`
**Files**:

- `apps/storybook/playwright/perf.spec.ts` — modify (add a second `test` group)

**Evidence**:

- Promotion triggers to measure (design §9): chunked hide (rAF callback p95 > 4 ms or any gesture frame > 33 ms on the 25k worst case), free-list (5k create+delete churn scan growth > 2×), dual-pad (jitter test), SHOW as index query (p95 over 23k slots > 2 ms), Editor arm (> 25% overhead).
- The shipping `scan(visit)` seam does not exist in PR1 (**Not found** — `packages/core/src/spatial/` is created in Step 10); the benchmark therefore uses a self-contained typed-array scan with the **same callback shape** `visit(slot, inside)`.
- Editor construction pattern: `new Editor({ container, modules: deterministicModules() })` (`InteractionHarness.stories.ts:46`).

**Instructions**:
Add in-page microbenchmarks run through `page.evaluate`: (1) typed-array scan + two-sided classification over 23k slots with a `visit` callback — report p50/p95 over 200 iterations; (2) hide-all-from-visible and show-all-from-hidden attribute-write passes on the real Perf Harness DOM; (3) the churn benchmark (5k distinct create/delete on the typed-array structure with tombstone/revive vs a free-list variant); (4) a ±1 px boundary jitter run (100 frames) on a prototype single-pad classifier; (5) one Editor-arm vs interactive-arm pan comparison from Step 5's measurement, reported as % overhead; (6) the **bulk-write probe**: set `data-pfd-transient` (with the temporary inline rule from Step 6) on ≥ 22k `<g>` of the Perf Harness in one tick and record the next-frame `TaskDuration`/`RecalcStyleDuration`; (7) a **`CULL_MIN_ELEMENTS` sweep**: unculled pan-frame `TaskDuration` p95 at N = 500, 1000, 2000, 5000, 10000 drawn elements (fixture presets from Step 2) to pick the smallest N where culling's per-frame cost is below the unculled cost — if the sweep contradicts the provisional 1000, `measurements.md` states the new value and why. Print a table and attach `triggers.json`; assert nothing numeric.

**Verification**:
`PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --project=perf`; typecheck/lint/format.

**Test**:
Same spec file; sanity assertions only (iterations completed, no NaN).

---

### Step 8 — `perf.yml` workflow (informational in PR1) and deploy opt-out

**Status**: `done`
**Files**:

- `.github/workflows/perf.yml` — create
- `apps/storybook/package.json` — modify (add `build-storybook:deploy`)
- `.github/workflows/deploy-storybook.yml` — modify
- `apps/storybook/.storybook/main.ts` — modify (env-gated `stories` globs; the primary mechanism — `--exclude-tags` does not exist in 8.6.18)

**Evidence**:

- Template: `visual-regression.yml` — container `mcr.microsoft.com/playwright:v1.56.1-noble` (`:46`), `git config --global --add safe.directory "$GITHUB_WORKSPACE"` (`:51-52`), pnpm setup, `setup-node` node 20, `pnpm install --frozen-lockfile` (`:61-62`), `pnpm build` (`:64-65`), `pnpm build-storybook` (`:67-68`), artifact upload `playwright-report` 14 days (`:124-130`); PLAT-08: image byte-locked to `@playwright/test` 1.56.1 (`docs/context-constitution.md:31`).
- `loadStories` requires `storybook-static/index.json` (`_support.ts:29,34-36`), so `perf.yml` must build Storybook first.
- `deploy-storybook.yml` runs `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm build-storybook`, then `upload-pages-artifact` of `apps/storybook/storybook-static` (digest §5) — it publishes every story today.
- **VERIFIED 2026-10-07: `storybook build --exclude-tags` does NOT exist in Storybook 8.6.18** (`pnpm --filter @d3-polytree/storybook exec storybook build --help` lists only `--disable-telemetry --debug --enable-crash-reports -o -c --quiet --loglevel --debug-webpack --webpack-stats-json --stats-json --preview-url --force-build-preview --docs --test -h`). Resolved tags do appear per entry in `index.json` (`["dev","test","harness-only"]`), which is what `loadStories` filters on, but they cannot filter the build — so the `stories`-globs approach is the primary mechanism here.
- Storybook config: `.storybook/main.ts` has `stories: ['../src/**/*.stories.@(ts|js)']`, no `tags`/`previewTags`.

**Instructions**:
Implement the opt-out in `.storybook/main.ts` (currently `stories: ['../src/**/*.stories.@(ts|js)']`, `:4`): when `process.env.STORYBOOK_DEPLOY === '1'`, use globs that exclude the two harness story files (e.g. a function returning the glob list, or a negated glob — verify which form Storybook 8.6.18 accepts with one local build); add `"build-storybook:deploy": "STORYBOOK_DEPLOY=1 storybook build --disable-telemetry"` to `apps/storybook/package.json` and make `deploy-storybook.yml` call `pnpm --filter @d3-polytree/storybook build-storybook:deploy`. Verify `storybook-static/index.json` from the deploy build lacks the `harness-only` stories and that the normal `build-storybook` still contains them. Do **not** change `build-storybook` (e2e and VR need the harness stories). Create `perf.yml`: triggers `pull_request` and `push` to `main`; same container/steps as `visual-regression.yml` through `pnpm build-storybook`, then `PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --project=perf`, `continue-on-error: true` **in this PR only** (no budget exists yet — design §11 PR1), uploading `perf.json`/`triggers.json`/`probes.json` and a job summary. Keep the image tag in lockstep with `@playwright/test` (PLAT-08, `docs/context-constitution.md:31`): add a comment in `perf.yml` naming `visual-regression.yml` and `apps/storybook/package.json:27` as the other two places to bump.

**Verification**:
`pnpm --filter @d3-polytree/storybook exec storybook build --help`; a local `pnpm --filter @d3-polytree/storybook build-storybook:deploy` and check `storybook-static/index.json` lacks the harness entries; YAML lint via the repo's own `pnpm format:check` (Prettier covers workflows); push to a branch and confirm the new workflow job runs green with `continue-on-error`.

**Test**:
N/A (CI/config-only). Observable outcome: the Pages build (`build-storybook:deploy`) contains no `harness-only` stories; the e2e build (`build-storybook`) still does.

---

### Step 9 — `measurements.md`, storybook docs

**Status**: `done`
**Files**:

- `docs/design/2026-10-06-c10-spatial-index-culling-perf/measurements.md` — create
- `apps/storybook/CLAUDE.md` — modify
- `apps/storybook/docs/context-constitution.md` — modify

**Evidence**:

- `apps/storybook/CLAUDE.md`: heading `## The e2e quality net (C8)` at `:33`; spec list `:35-37` ("`vr.spec.ts`, `a11y.spec.ts`, `interactions.spec.ts`"); harness bullet ~`:54` ("fixture-only (`tags: ['!autodocs']`)"); last bullet ~`:55-56` ("`test:e2e` runs it all; it is deliberately **not** wired into `turbo run test`"); fixtures sentence `:18-31` ("Shared `.pfdn` fixtures live in `src/sample.ts`").
- `apps/storybook/docs/context-constitution.md`: SB-03 at `:17` names `'Components/Editor'` and `'Tests/Interaction Harness'`; SB-01 at `:15`; candidate-rule row `:34` currently states "`_support.ts#loadStories` filters on `type === 'story'`, ignoring tags" — **becomes false after Step 1**.

**Instructions**:
Create `measurements.md` recording every number from Steps 5–7 against design §9's triggers (which mechanism is promoted, which stays default) and the §7 budget inputs: off-arm and (once PR2 exists) on-arm p95 spread and the `(off median p95 − on max p95) ≥ 2× spread` separation check (PR1 can only record the off arm; the separation verdict is a PR2 deliverable, Step 24), plus `CULL_MIN_ELEMENTS` (from Step 7's sweep), the single pad (`ceil(max per-class painted-extent overhang from Step 6)+1`; **provisional** — G1 in Step 23 is the authoritative check and a failure there re-tunes the pad via the Deviation Log), and the P1–P4 outcomes. Update `apps/storybook/CLAUDE.md` (add `culling.spec.ts`/`perf.spec.ts`/`culling-probes.spec.ts`/`harness-filter.spec.ts` to the spec list; the `harness-only` tag; `PERF=1`/`test:perf`; `src/perf/`; `build-storybook:deploy`) and the constitution (SB-03 titles, SB-01 evidence files, rewrite the `:34` candidate row to describe the new `harness-only` filter).

**Verification**:
`pnpm format:check`; reread both docs for stale statements (`grep -n "ignoring tags" apps/storybook/docs/context-constitution.md` returns nothing).

**Test**:
N/A (docs-only).

---

## PR2 — Culling (default on)

### Step 10a — Resize the correctness fixture (`SMALL`) to ≥ 2 × `CULL_MIN_ELEMENTS`

**Status**: `pending`
**Files**:

- `apps/storybook/src/perf/fixture.data.ts` — modify
- `apps/storybook/playwright/fixture.spec.ts` — modify
- `apps/storybook/playwright/culling-probes.spec.ts` — modify (stale "~2.7k" comment at `:6` only)
- `apps/storybook/CLAUDE.md` — modify

**Evidence**:

- `fixture.data.ts`: `export const SMALL: FixtureOptions = { nodes: 1_200, links: 1_400, labelRatio: 0.1, zones: 10, longRangeRatio: 0.05, seed: 1 }` (~2.7k drawn elements, header comment "required-lane correctness fixture (≥ 2× CULL_MIN_ELEMENTS)"); `drawnElementCount(spec)` sums nodes + links + labels + zones; labels = every `round(1/labelRatio)`th node.
- `fixture.spec.ts:35-36`: `test('SMALL stays above 2x the provisional CULL_MIN_ELEMENTS (1000)', …toBeGreaterThanOrEqual(2000))`.
- Design A1 / `measurements.md` §3: `CULL_MIN_ELEMENTS` = 5,000 ⇒ the required-lane fixture must be ≥ 10,000 drawn elements. Measured boot: 9,216 drawn ≈ 2.4 s interactive / ≈ 5.2 s Editor (`measurements.md` §2–3).
- Consumers of `SMALL`: `src/perf/harness.ts` (`kind === 'perf' ? LARGE : SMALL`), `culling-probes.spec.ts` (required lane; today `test.setTimeout(90_000)` at `:70`, which already covers one ≈ 10.6k-element boot per test — no change needed; its header comment at `:6` still says "~2.7k"), `fixture.spec.ts`.
- `apps/storybook/CLAUDE.md` currently says "`Tests/Culling Harness` (~2.7k elements)".

**Instructions**:
Set `SMALL = { nodes: 4_600, links: 5_520, labelRatio: 0.1, zones: 18, longRangeRatio: 0.05, seed: 1 }` (460 labels ⇒ 10,598 drawn elements) and update its doc comment to "~10.6k drawn elements: ≥ 2× `CULL_MIN_ELEMENTS` (5,000)". Update `fixture.spec.ts`: rename the test to `SMALL stays above 2x CULL_MIN_ELEMENTS (5,000)` and assert `≥ 10_000`; the other SMALL-based tests are shape-only and stay. Update `apps/storybook/CLAUDE.md` ("~2.7k" → "~10.6k"). Then re-run `culling-probes.spec.ts` and `harness-filter.spec.ts` against the rebuilt Storybook (the probes boot the Culling Harness; expect ≈ 3–6 s boots) and record the actual boot times in the Deviation Log if a test exceeds half of its 90 s timeout. Also update the stale "~2.7k" comment at `culling-probes.spec.ts:6`.

**Verification**:
`pnpm --filter @d3-polytree/storybook typecheck`; `pnpm build && pnpm build-storybook && pnpm --filter @d3-polytree/storybook test:e2e fixture culling-probes harness-filter` (`apps/storybook/package.json:10`); `pnpm lint`; `pnpm format:check`.

**Test**:
`fixture.spec.ts` (modified above): fails before (SMALL is ~2.7k < 10,000), passes after. Command: `pnpm --filter @d3-polytree/storybook test:e2e`.

---

### Step 10 — `core/src/spatial/`: seam, `FlatIndex`, `elementBounds`

**Status**: `pending`
**Files**:

- `packages/core/src/spatial/types.ts` — create
- `packages/core/src/spatial/elementBounds.ts` — create
- `packages/core/src/spatial/FlatIndex.ts` — create
- `packages/core/src/spatial/index.ts` — create
- `packages/core/src/spatial/spatial.test.ts` — create
- `packages/core/src/index.ts` — modify

**Evidence**:

- Pattern: `packages/core/src/route/` = `index.ts` (header comment: "A pure, deterministic, dependency-free sub-module… no DOM/D3/moddle coupling so it is fixture-testable and worker-extractable", then `export { avoidObstacles, segmentIntersectsObstacle } from './obstacles';` `:9`, `export type { Obstacle, RoutePoint } from './types';` `:10`), `obstacles.ts`, `types.ts`, `route.test.ts`.
- `route/route.test.ts:1-25`: `import { describe, expect, it } from 'vitest'`, imports from the sibling module (not the barrel), pure numeric fixtures, no DOM.
- `route/types.ts:19-24` `Obstacle { id, x, y, size }` is square-only → a new rect type is justified (DN-2).
- Barrel: `packages/core/src/index.ts:27 export * from './draw';`, `:31 './features'`, `:33 export * from './route';`, `:34 './command'`.
- Geometry sources: node `position`+`size` (`definitions.ts:40-44`), link `waypoint[]` (`definitions.ts:32-37`), zone `position`/`width`/`height`/`border.lineWidth` (`definitions.ts:16-29`), label `position`/`fontSize`/`text` (`definitions.ts:9-14`; moddle default `fontSize` 13, `pfdn.json:208-211`).
- Reads must be direct property reads, not `.get()` on isMany (ledger 2026-09-20; `zoom.ts:93-98` precedent); the tests' defs are `makeDef` Map-backed stubs (`packages/core/src/draw/drawerTestUtils.ts:8-21`).
- PLAT-06: Map lookup-only, never iterate for output (`docs/context-constitution.md:29`).

**Instructions**:
`types.ts`: `Bounds { x0, y0, x1, y1 }` and `SpatialIndex { upsert(id: string, b: Bounds): number; remove(id: string): void; scan(rect: Bounds, visit: (slot: number, inside: boolean) => void): void }`. `elementBounds(kind: 'node'|'link'|'zone'|'label', def): Bounds` with design §2 formulas (node `[x−3, x+size+9]`, link AABB ± `(4.5·lineWidth+2)`, zone ± `border.lineWidth/2`, label `w = max(1,len)·fontSize·1.2+3.66+6`, `h = fontSize·1.5+3.66+6`); any missing/non-finite input returns bounds `{-Infinity,-Infinity,Infinity,Infinity}` (always visible). `FlatIndex`: typed-array bounds (Float64Array ×4), `ids: string[]`, an id→slot `Map` used only for lookup, **free-list slot reuse** (`free: number[]` LIFO stack: `remove` frees the slot and deletes the id→slot entry, `upsert` of a new id pops a free slot before growing capacity; a re-`upsert` of a removed id may therefore get a different slot — `Culling.created` rebinds the node and resets the flag, so nothing depends on slot identity across remove); `upsert` of a live id returns its existing slot; `scan` iterates slots in ascending index order calling `visit(slot, inside)` for live slots. Export from `spatial/index.ts` and add `export * from './spatial';` to `packages/core/src/index.ts` after the `route` line (`:33`). Declare and export `CULL_MIN_ELEMENTS` (**5000**, from the PR1 sweep), `CULL_PAD` (**7** = `ceil(max per-class overhang 6)+1`, provisional until G1) and `HIDE_BUDGET` (**300**, provisional, tuned from PR2 perf data) from `packages/core/src/spatial/types.ts` (re-exported by `spatial/index.ts`; `@internal`; values and rationale in `measurements.md` §2–3, §5) — exported so Step 21/23 tests read the real constants. (`@internal` is documentation only; no `stripInternal` is configured, so they are publicly exported through `export *` — accepted.)

**Verification**:
`pnpm --filter @d3-polytree/core test src/spatial/spatial.test.ts` (single-file form from `CLAUDE.md`); `pnpm --filter @d3-polytree/core typecheck`; `pnpm --filter @d3-polytree/core build`; `pnpm lint`; `pnpm format:check`.

**Test**:
`packages/core/src/spatial/spatial.test.ts` — create, mirroring `route.test.ts` structure. Cases: `scan` equals a brute-force intersect on a seeded random set (inline mulberry32 — no shared helper exists, digest §8); upsert of a live id returns the same slot; remove then scan skips; a removed slot is reused by the next new id (no capacity growth); `elementBounds` per kind incl. bare/non-finite defs ⇒ always-visible bounds; label estimator monotone in `fontSize` and text length; the exported constants equal the measured values (`CULL_MIN_ELEMENTS === 5000`, `CULL_PAD === 7`, `HIDE_BUDGET === 300`) so a silent change fails a test and forces a `measurements.md` update; **free-list (design §9, A1):** the trigger is re-expressed deterministically — slot capacity after 10 cycles of create 5,000 new ids / remove the previous 5,000 must be ≤ 2 × the peak live count — because a timing ratio flaked in PR1 (1.87× / 2.56×) and was circular. `measurements.md` §2 already shows tombstone-only allocates 50,000 slots for 5,000 live (10×), so the trigger is met by construction and the free-list ships in this step (pre-approved by design §9; ~5 lines): assert capacity ≤ 10,000 after the churn. A scan-time comparison (≥ 5 runs, median) is recorded to the Deviation Log via `console.info('[perf]…')` and is NOT asserted. Command: `pnpm --filter @d3-polytree/core test` (`packages/core/package.json:25`). Fails before (module absent).

---

### Step 11 — `BaseElement.updateElement` title refresh (N1)

**Status**: `pending`
**Files**:

- `packages/core/src/draw/BaseElement.ts` — modify
- `packages/core/src/draw/BaseElement.test.ts` — modify

**Evidence**:

- `BaseElement.ts:108-116` `_accessibleName` (name → text → type → class); `:128` `newElem.append('title').text(this._accessibleName(definition));`, `:129` `newElem.append('desc').text(definition.id as string);`; `:140-150` `updateElement`, with `:145 element.datum(definition);` then `:146 this._updateElement(element, definition);`.
- Outline displaces `:first-child` (`outline.ts:65-66` `element.insert('rect', ':first-child')`), so `<title>` is not the first child once Outline ran — use `selectChild('title')`.
- `selectChild` is d3-selection v3 (`packages/core/package.json:35,44` pin `^3.0.0`; `pnpm-lock.yaml:104-111` resolves 3.0.0; **VERIFIED 2026-10-07**: `selectChild` is registered in `node_modules/.pnpm/d3-selection@3.0.0/node_modules/d3-selection/src/selection/index.js:3,55`). No existing `selectChild` call in `packages/*/src` (no local precedent).
- Existing test to extend: `BaseElement.test.ts:77-84` ("writes a <title>/<desc> accessible name into each element <g> (C2)"); helpers `makeDef` `:10-19` (mutable `set`), `TestElement` hard-coded to className `'node'` `:21-28`, `build()` `:30-46`.

**Instructions**:
After `:145 element.datum(definition);` (before `:146`) add: compute `const name = this._accessibleName(definition); const title = element.selectChild('title'); if (!title.empty() && title.text() !== name) title.text(name);`. Do not touch `<desc>`. If `selectChild` is unavailable at the installed version, fall back to a `firstElementChild`-style scan over `element.node().children` for `localName === 'title'` and record the deviation. Then run the ssr suite and VR to prove no unintended change (Step 22 re-checks).

**Verification**:
`pnpm --filter @d3-polytree/core test src/draw/BaseElement.test.ts`; `pnpm --filter @d3-polytree/core typecheck`; then `pnpm build && pnpm --filter @d3-polytree/ssr test`; `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `BaseElement.test.ts`: after `build([makeDef('n1', { name: 'Alpha' })])`, `def.set('name','Beta'); el.updateElement(def)` ⇒ `title` is `node: Beta`; a second case inserts an outline rect with `g.insert('rect', ':first-child')` first, then updates, asserting the right `<title>` changed and the nested/other children are untouched; a third asserts `updateElement` does not rewrite `<title>` when unchanged (spy on `.text`). Command: `pnpm --filter @d3-polytree/core test`. Fails before (title stays `Alpha`).

---

### Step 12 — canvas: transient-attribute constant + clone-only strip

**Status**: `pending`
**Files**:

- `packages/canvas/src/SvgExportingUtils.ts` — modify
- `packages/canvas/src/index.ts` — modify
- `packages/canvas/src/SvgExportingUtils.test.ts` — modify

**Evidence**:

- `SvgExportingUtils.ts:9` `export function getSvgString(svgNode: SVGSVGElement): string {`; `:14` `const clone = svgNode.cloneNode(true) as SVGSVGElement;`; `:15` sets `xlink`; `:16` `appendCSS(getCSSStyles(svgNode), clone);` (reads the **live** node); `:18-22` serializes. Strip goes between `:14` and `:16`.
- `getCSSStyles` matcher `:33-54`; rule inlined when `selectorText` contains `[sels].<cls>[sels]` for a live class (`:74`), `sels = '[\\.,#\\s\\*>+~\\[=:]'` (`:34`) — so the culling rule **will** be inlined into browser exports (design §5), inert after the strip.
- `packages/canvas/src/index.ts:7` `export { getSvgString } from './SvgExportingUtils';`.
- Existing test `SvgExportingUtils.test.ts:5` ("serializes an svg node and normalizes the xlink namespace") builds svg/rect with `document.createElementNS`; no stylesheet or clone-vs-live test exists.

**Instructions**:
Export `export const TRANSIENT_ATTR = 'data-pfd-transient';` (from `SvgExportingUtils.ts`, re-exported in `index.ts` next to `:7`). After `:14` add `clone.querySelectorAll(`[${TRANSIENT_ATTR}]`).forEach((n) => n.removeAttribute(TRANSIENT_ATTR));`. Canvas stays ignorant of culling (the attribute is generic "transient"). Core imports the constant from `@d3-polytree/canvas` (as at `core/src/index.ts:8`).

**Verification**:
`pnpm --filter @d3-polytree/canvas test`; `pnpm --filter @d3-polytree/canvas typecheck`; `pnpm --filter @d3-polytree/canvas build` (core and downstream read this `dist`); `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `SvgExportingUtils.test.ts`: (a) a node with `data-pfd-transient="culled"` — serialized string has no `data-pfd-transient`, and the live node still has it; (b) a document stylesheet rule whose selector contains `.element[data-pfd-transient]` and a live `.element` node ⇒ the serialized `<style>` contains the rule (documents the honest leak, design §5); (c) export of an unmarked tree is byte-identical to the pre-change output (compare with a golden string built the same way). Command: `pnpm --filter @d3-polytree/canvas test` (`canvas/package.json:22-26`).

---

### Step 13 — `ViewerOptions.culling`

**Status**: `pending`
**Files**:

- `packages/viewer/src/index.ts` — modify
- `packages/viewer/README.md` — modify (the `ViewerOptions` table, ~`:51-54`)
- `packages/viewer/CLAUDE.md` — modify (the line saying options accept `{ container, modules }`)

**Evidence**:

- `viewer/src/index.ts:53-65` `ViewerOptions` has `container?`, `modules?`, and `[key: string]: unknown;` at `:64`; `readonly options: ViewerOptions;` at `:83`, set at `:104-106`. `InteractiveViewerOptions = ViewerOptions` (`interactive-viewer/src/index.ts:34`); `EditorOptions extends InteractiveViewerOptions` (`editor/src/index.ts:58-67`).
- Only `container` and `modules` are forwarded to the engine (`:229-238`), so `culling` is read through the `d3polytree` host value (`d3polytree.options`).

**Instructions**:
(Public-API change ⇒ README per `CLAUDE.md` "Package READMEs"; `packages/viewer/README.md:51-54` documents the `ViewerOptions` table — add a `culling?: boolean` row there and update `packages/viewer/CLAUDE.md`; verify both line ranges when editing.)
Add, before the index signature at `:64`, `/** Viewport culling for large diagrams. Default: on (inert below a count threshold). */ culling?: boolean;`. Change nothing else; `element`/`react` pass no `culling`, which means default-on (digest §1: they forward only `{container, modules}`), so DN-7 says no new prop/attribute there.

**Verification**:
`pnpm --filter @d3-polytree/viewer typecheck`; `pnpm typecheck` (all dependents); `pnpm lint`; `pnpm format:check`.

**Test**:
N/A (type/docs-only; exercised by Steps 14–17 which read `options.culling`).

---

### Step 14 — `Culling` slice A: class, module, upsert/remove/update handlers

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — create
- `packages/core/src/features/culling.test.ts` — create
- `packages/core/src/features/index.ts` — modify

**Evidence**:

- Outline skeleton (`features/outline.ts`): imports `:1-6` (`EventEmitter`, `DiagramEventMap` from canvas, `getLocalName`, `DrawingSelection`, `ModellingModelElement`); `:25 export class Outline {`; `:26 static readonly $inject = ['eventBus'];`; ctor `:30-33`; subscription loop `:90-95` — `(['node','label','zone','link'] as const).forEach((cls) => { bus.on(`${cls}.created`, this._createOutline, this); bus.on(`${cls}.updated`, …) })`; handler signature `(element: DrawingSelection, definition: ModellingModelElement)`.
- `features/index.ts`: imports `:1-24` (`Axes` `:6`, `Outline` `:7`), re-exports `:26-59`, `axesModule` `:98-102` (`{ __init__: ['axes'], axes: ['type', Axes], __depends__: [zoomModule] }`), `outlineModule` `:105-108`. (Design's `__init:` is a typo; the repo uses `__init__`.)
- Injection precedents: `axes.ts:32` `['d3polytree.definitions.settings.grid','canvas','eventBus','zoom']`; `keyboardNav.ts:44` `['canvas','eventBus','d3polytree','selection']`; `tooltip.ts:20` `['d3polytree.options.tooltip','canvas','eventBus']` (a missing option arrives as `undefined`); `zoom.ts:41-46` `['d3polytree.definitions.settings.zoom','canvas','eventBus','calculateCenter']`.
- `.removed` can carry a bare `{ id }` (`BaseElement.ts:99-101`; ledger c2) — handlers must read only `definition.id`. Undo/redo re-creates ids via `reconcile` → `appendElement` building a NEW `<g>` (`commands.ts:73-79`; `BaseElement.ts:69-70`).
- Test pattern: `outline.test.ts:11-27` — `drawing()` builds `svg > g > g.innerElement` via `select(document.body)`; `bus.emit('node.created', el as unknown as DrawingSelection, def)`; defs from `moddle.create('pfdn:Node', {...}) as unknown as ModellingModelElement` (`:29-45`); `beforeEach` `document.body.innerHTML = ''`.
- PLAT-02: every DI class declares `static readonly $inject` and its module binds `['type', Class]` with `__init__` (`docs/context-constitution.md:25`).

**Instructions**:
Create `Culling` with `static readonly $inject = ['canvas', 'eventBus', 'd3polytree', 'd3polytree.definitions.settings.zoom']`. State: a `FlatIndex`, parallel arrays `nodes: (SVGGElement|null)[]` and `culled: Uint8Array` (grown with capacity), `active`, `slotsDirty`, `viewportDirty`, `destroyed`. Subscribe (Outline loop shape) `<cls>.created/.updated/.removed/.moving` for `['node','label','zone','link']`. `created` = idempotent upsert: compute `elementBounds(cls, def)`, `slot = index.upsert(def.id, bounds)`, store the new `<g>` node, reset `culled[slot]=0`, remove any stale attribute on the new node. `updated`/`moving` recompute bounds and set `slotsDirty`. `removed` calls `index.remove(def.id)` reading only `.id`. Read `culling` as `(d3polytree as {options?: {culling?: boolean}}).options?.culling !== false`. Export `Culling` and `cullingModule = { __init__: ['culling'], culling: ['type', Culling], __depends__: [zoomModule] }` (Axes pattern `:98-102`) from `features/index.ts` (import `:1-24`, re-export `:26-59`). Add a read-only `@internal` method `inspect(): { active: boolean; pad: number; slots: ReadonlyArray<{ id: string; bounds: Bounds; culled: boolean; node: SVGGElement | null }> }` (test/diagnostic accessor; no mutation) so Steps 21 and 23 can assert index⇄model consistency through `editor.get('culling')` (`Viewer.get`, `viewer/src/index.ts:180`). Also expose `stats: { passes: number; maxHides: number }` in `inspect()` (counters incremented by the rAF pass in Step 15; `maxHides` = the largest number of hide writes in any single pass) so Step 23 can gate the per-frame budget deterministically instead of attributing MutationObserver records to frames. Import `CULL_MIN_ELEMENTS`/`CULL_PAD`/`HIDE_BUDGET` in `culling.ts` from `'../spatial/types'` (the module Step 15's `vi.mock` targets). Do **not** register it in any component yet (Step 18). Do not write `status` (CORE-01).

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/culling.test.ts`; `pnpm --filter @d3-polytree/core typecheck`; `pnpm --filter @d3-polytree/core build`; `pnpm lint`; `pnpm format:check`.

**Test**:
`packages/core/src/features/culling.test.ts` — create, with the Outline test helpers: created→slot bound to the new `<g>`; re-created id (undo/redo) resets slot to visible and rebinds the NEW node; removed with a bare `{ id }` does not throw and frees the slot; updated/moving change stored bounds; option `culling:false` ⇒ inactive; `inspect()` reflects created / removed / culled state (`slots` ids, `culled` flags, `node` binding, `active`) — Steps 21 and 23 rely on it. Command: `pnpm --filter @d3-polytree/core test` (`packages/core/package.json:25`).

---

### Step 15 — `Culling` slice B: viewport, synchronous SHOW, rAF two-sided pass

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — modify
- `packages/core/src/features/culling.test.ts` — modify
- `packages/core/src/features/zoom.test.ts` — modify

**Evidence**:

- `setZoom` (`zoom.ts:78-102`): emits `zoom.preZoom` (`:79`); only if `_isZoomable` writes `transform` (`:91`), persists `this._options.scale = s; if (this._options.offset) { offset.x = tx; offset.y = ty }` (`:94-98`, direct property writes), then `this._eventBus.emit('canvas.zoomed')` (`:100`, no payload). `ZoomModel` has optional `offset` and `scale` (`zoom.ts:25-29`).
- Reading: direct property reads (`options.scale`, `options.offset.x/y`), never `.get()` on isMany (ledger 2026-09-20). `canvas.getTransform()` (`Canvas.ts:105-119`) allocates a `<g>` per call and is identity in jsdom (`:112,:116,:108`) — not used.
- Viewport rect in world units for `translate(tx, ty) scale(s)` (`zoom.ts:91`): `[-tx/s, -ty/s, (W-tx)/s, (H-ty)/s]`; transforms are translate+scale only (PLAT-N09, `docs/context-constitution.md:37`).
- Test pattern for driving the viewport: `zoom.test.ts:11-18` (`setup()` with `emptyModel()`, `new Canvas({container: document.body}, bus)`, `new CalculateCenter(canvas)`, `options = definitions.settings.zoom`), and `:39-58` (`zoom.setZoomable(true); zoom.setZoom(10,20,2)` ⇒ `options.scale === 2`, `canvas.zoomed` fires).
- Size: `Canvas.getSize()` (`Canvas.ts:121-126`) returns `clientWidth/clientHeight`, 0 in jsdom; no test stubs it today (digest §3) — stub with `vi.spyOn(canvas, 'getSize')`.
- Hide mechanism = write `data-pfd-transient` (constant from `@d3-polytree/canvas`, Step 12) on the cached `<g>`; the CSS rule arrives in Step 18.

**Instructions**:
Subscribe to `canvas.zoomed`. Handler: read viewport (fail open if `scale`/`offset` missing or non-finite ⇒ treat everything as visible, no hides); run the **SHOW pass synchronously** — `index.scan(showRect, visit)` where `visit(slot, inside)` un-hides (`removeAttribute`, `culled[slot]=0`) any culled slot with `inside`; set `viewportDirty`; request ONE rAF if none pending. The rAF callback is stateless, two-sided and **hide-budgeted (design A1)**: recompute the viewport, rescan ALL slots with the single world-unit `CULL_PAD` each frame (no cursor, no epoch — a ~0.3 ms scan at 23k slots, `measurements.md` §2), show `inside && culled` (unbounded — correctness), hide `!inside && !culled` (set attribute to `'culled'`; the SHOW pass and this pass use the SAME padded rect, so a slot can never be shown by one and hidden by the other in the same state; each pass updates `stats.passes`/`stats.maxHides`) for at most `HIDE_BUDGET` slots in ascending slot order (deterministic, PLAT-06), and if any qualifying hide remains set `backlog` and request the next rAF; clear `viewportDirty`/`slotsDirty` only when no backlog remains; skip entirely when `!viewportDirty && !slotsDirty && !backlog`. Pad = value from `measurements.md` (`ceil(max measured overhang)+1`). No allocations when nothing changes (reuse the `visit` closure; no per-frame arrays). `created` events before the first rAF do not hide (boot is all-visible, `BaseElement.ts:160-168`).

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/culling.test.ts`; typecheck; `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `culling.test.ts` with stubs: `getSize` → `{width:800,height:600}`, `requestAnimationFrame`/`cancelAnimationFrame` via `vi.stubGlobal` driven manually, ResizeObserver unused here. Cases: far elements get the attribute after the rAF; near elements do not; `setZoom` pan brings a culled element back **synchronously** (before any rAF); pan-out → pan-back → drain (no element inside the padded viewport ends with the attribute; ≤ 1 toggle per direction, ≤ 2 per cycle); unchanged second flush performs zero attribute writes (spy `setAttribute`/`removeAttribute`) — ledger c14; missing `offset` ⇒ nothing hidden; **budgeted drain (A1):** with N = 3×`HIDE_BUDGET`+7 off-screen elements the first rAF performs exactly `HIDE_BUDGET` hides and the following frames continue (backlog counts as dirty) until all are hidden after ⌈N/`HIDE_BUDGET`⌉ frames, in ascending slot order; a pan-back mid-drain never hides an in-view element and ends with ≤ 1 toggle per direction; a pan revealing more than `HIDE_BUDGET` elements shows them ALL synchronously (shows are unbounded). To keep fixtures tiny (≥ 20 slots so the mocked `CULL_MIN_ELEMENTS` is met) these unit tests mock the constants (`vi.mock('../spatial/types', async (orig) => ({ ...(await orig<typeof import('../spatial/types')>()), CULL_MIN_ELEMENTS: 20, HIDE_BUDGET: 5 }))`); Step 16 adds the one test that uses the real constants. Also extend `zoom.test.ts` (pattern `:39-58`): after `zoom.setZoomable(true); zoom.setZoom(10,20,2)`, the drawing layer's parsed `transform` attribute equals the persisted `options.scale`/`options.offset` (design §7 "persisted settings == parsed transform"). NOTE: this step reads size via `canvas.getSize()` stubs; Step 16 replaces that with the RO-cached size, and the Step 15 tests stay valid because jsdom has no `ResizeObserver`. Command: `pnpm --filter @d3-polytree/core test`.

---

### Step 16 — `Culling` slice C: inert rules, ResizeObserver, lifecycle, idle attribute

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — modify
- `packages/core/src/features/culling.test.ts` — modify
- `packages/core/src/features/culling.realconstants.test.ts` — create (no constants mock; Step 15's file-wide hoisted `vi.mock('../spatial/types', …)` cannot be undone per test)

**Evidence**:

- Teardown path: `Diagram.destroy()` emits `d3canvas.destroy` (`Diagram.ts:74-76`) → `Canvas.ts:66` `eventBus.on('d3canvas.destroy', () => this._destroy())` → `_destroy` (`Canvas.ts:69-75`) emits `canvas.destroy` and removes the container; `Viewer._teardown()` → `diagram.destroy()` (`viewer/src/index.ts:205`; VIEWER-01, `packages/viewer/docs/context-constitution.md:15`). `d3canvas.clear` (`Diagram.ts:78-80`) only emits; its sole consumer is `CommandStack` `_quarantine` (`CommandStack.ts:74`) — **do not subscribe** (design A8).
- `canvas.resized` exists (`events.ts:83`) and is emitted at init (`Canvas.ts:62-65`) and by `PfdnPropertiesProvider.ts:183`. `getContainer()` is `Canvas.ts:78-80` (`div.pfdjs-container`, outside the `<svg>`; `getSVGStr` serializes the svg only, `Canvas.ts:88-90`).
- No `ResizeObserver` anywhere in the repo and no vitest polyfill (digest §3 "Not found"); jsdom lacks ResizeObserver but has rAF (`pretendToBeVisual`: `packages/ssr/src/dom.ts:23`; vitest jsdom).
- `d3canvas.init` boot latch precedent: `ariaAnnouncer.ts` `canvas.init` latch; `CommandStack.ts:57,72`.

**Instructions**:
Create the `ResizeObserver` in the constructor, guarded by `typeof ResizeObserver === 'function'`, observing `canvas.getContainer()`; its callback caches `{width,height}` from the entry (`entry.contentRect.width/height`), **re-evaluates `active`** (so activation can occur after `importDiagram` once a size arrives), marks dirty and runs the synchronous SHOW pass; also subscribe `canvas.resized`. `active` = option !== false && `slotCount ≥ CULL_MIN_ELEMENTS` (checked cheaply on `created`) && cached size > 0; `getSize()` is only a fallback when no RO exists and is never read in a `created` handler. Inert checks run **before** requesting rAF; capture `{ id, cancel: globalThis.cancelAnimationFrame.bind(globalThis) }` at schedule time; every rAF/RO callback begins `if (this.destroyed) return`. On `d3canvas.destroy`: cancel the pending rAF with the captured function, `ro?.disconnect()`, `destroyed = true`, remove the idle attribute. Idle attribute `data-pfd-culling-idle` on `canvas.getContainer()`: `"false"` written synchronously in every handler that marks dirty (`zoomed`, RO, `created`, `updated`, `removed`, `moving`); `"true"` only when no rAF is pending, nothing is dirty and no hide backlog remains (idle stays `"false"` throughout a budgeted drain); absent until activation and never set in jsdom/ssr paths. If the count falls below `CULL_MIN_ELEMENTS`, reveal all once and deactivate.

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/culling.test.ts`; typecheck; `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `culling.test.ts` (stub `globalThis.ResizeObserver` with a class capturing the callback): size 0 ⇒ the rAF callback is a no-op and nothing is hidden; `requestAnimationFrame` is requested at most once per dirty burst (spy); jsdom with no RO stays inert; destroy cancels the pending rAF and disconnects the RO and a late-fired callback is a no-op; emitting `d3canvas.clear` changes nothing; idle attribute is `"false"` synchronously after each marking handler, `"true"` after drain, absent when inert; count dropping below `CULL_MIN_ELEMENTS` reveals everything; **real-constants test (in `culling.realconstants.test.ts`, unmocked `CULL_MIN_ELEMENTS` = 5000):** with a stubbed non-zero size, `inspect().active` is `false` at 4,999 slots and `true` at 5,000; idle stays `"false"` while a backlog drains and flips `"true"` on the last frame. Command: `pnpm --filter @d3-polytree/core test`.

---

### Step 17 — `Culling` slice D: label reveal-before-measure and CSS self-check

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — modify
- `packages/core/src/features/culling.test.ts` — modify

**Evidence**:

- Only `getBBox` consumer: `outline.ts:55-60` — `const inner = element.select<SVGGElement>('.innerElement').node(); const bbox = inner && typeof inner.getBBox === 'function' ? inner.getBBox() : { width: 0, height: 0 };` for labels and zones; Outline subscribes `created`/`updated` at `:90-95`. Zones' paint `<rect>` is a direct child of the zone `<g>` and `.innerElement` is empty (`Zones.ts:36-43`) ⇒ only labels need reveal (design A7).
- Module registration order = event-subscription order (`CLAUDE.md` DI invariant 2); eventemitter3 preserves registration order.
- `getComputedStyle` is not stubbed in any existing test (digest "Not found"); jsdom implements `getComputedStyle` but not the CSS cascade of the shipped stylesheet.

**Instructions**:
Subscribe `label.created` and `label.updated` (registered in the constructor, i.e. before Outline's by module order): remove the attribute from that `<g>`, set `culled[slot]=0`, `slotsDirty=true`. Nodes/links/zones are NOT revealed. Self-check: after the first hide pass that sets any attribute, read `getComputedStyle(<first hidden element>.firstElementChild-that-is-not-title/desc).display`; if not `'none'`: while `document.readyState !== 'complete'` re-check on `window` `load` (or next rAF if already complete); a failure at/after `complete` is definitive → remove every `data-pfd-transient`, `active=false`, `console.warn('culling CSS not loaded; culling disabled')` once. Keep the attributes while the check is pending.

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/culling.test.ts`; typecheck; `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `culling.test.ts`: construct `Culling` then `Outline` on one bus, stub `getBBox` on a label's `.innerElement` and assert, at call time, `el.closest('[data-pfd-transient]') === null` for a culled label whose `label.updated` fires (reveal-before-measure) — and that it is re-hidden by the next rAF when still outside the padded viewport; zone/node `.updated` do not remove the attribute; self-check: with `getComputedStyle` stubbed to `display:'inline'` ⇒ after `complete` all attributes removed, `active` false, exactly one `console.warn`; with `'none'` ⇒ nothing changes and no warn; a failure before `complete` keeps attributes and re-checks on `load`. Command: `pnpm --filter @d3-polytree/core test`.

---

### Step 18 — CSS rule, module registration, module-order tests

**Status**: `pending`
**Files**:

- `packages/interactive-viewer/src/_culling.scss` — create
- `packages/interactive-viewer/src/style.scss` — modify
- `packages/interactive-viewer/src/index.ts` — modify
- `packages/interactive-viewer/src/index.test.ts` — modify
- `packages/editor/src/index.test.ts` — modify

**Evidence**:

- `style.scss:1-8` imports `./tokens`, `./outline`, `./focus`, `./notifications/style`, `./side-tabs/style`, `./search-panel/style`.
- `_outline.scss:1-15` / `_focus.scss:1-9` pattern: leading `//` comment header, nested `.pfdjs-container { .element { & > … } }`.
- Build: `interactive-viewer/package.json` `"build": "tsup && sass src/style.scss dist/style.css --no-source-map --style=compressed --silence-deprecation=import"`; `editor/package.json:25` identical form.
- `interactive-viewer/src/index.ts`: imports from `@d3-polytree/core` at `:10-22` (`backgroundColorModule, zoomModule, zoomScrollModule, axesModule, mouseEventsModule, selectionModule, outlineModule, keyboardNavModule, ariaAnnouncerModule, type DiagramModule`); `interactionModules` `:44-61` — `backgroundColorModule` `:45`, `zoomModule` `:46`, `zoomScrollModule` `:47`, `axesModule` `:48`, `mouseEventsModule` `:49`, `selectionModule` `:50`, `outlineModule` `:51`, `keyboardNavModule` `:55`, `ariaAnnouncerModule` `:56`, `sideTabsModule` `:59`, `searchPanelModule` `:60`, each written `xModule as DiagramModule,`; `getModules()` `:63-73` returns `[...InteractiveViewer.interactionModules, ...Viewer.modules, domNotificationsModule as DiagramModule]`.
- Editor inherits via `editor/src/index.ts:182-193` spread (`:186`); no Editor code change needed.
- Current tests only check lengths: `interactive-viewer/src/index.test.ts:22`, `editor/src/index.test.ts:14-15`; no order test exists.
- PLAT-01: the DOM-notifications module stays last (`docs/context-constitution.md:19`); interactive-viewer IV-02 (`packages/interactive-viewer/docs/context-constitution.md:15`).

**Instructions**:
`_culling.scss` (header comment explaining the contract: hides all but `title`/`desc` of a culled element, fail-open without this sheet): `.pfdjs-container { .element[data-pfd-transient] > :not(title):not(desc) { display: none; } }`. Add `@import './culling';` after `./focus` in `style.scss`. In `interactive-viewer/src/index.ts` import `cullingModule` from core and insert `cullingModule as DiagramModule,` **between `selectionModule` (`:50`) and `outlineModule` (`:51`)** — after selection (which it does not depend on) and before outline so its `label.*` handlers run first.

**Verification**:
`pnpm build` (compiles sass; `ci.yml:38`); `pnpm --filter @d3-polytree/interactive-viewer test`; `pnpm --filter @d3-polytree/editor test`; `grep -c "data-pfd-transient" packages/interactive-viewer/dist/style.css` ≥ 1; `pnpm typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
`interactive-viewer/src/index.test.ts`: assert `interactionModules.indexOf(cullingModule) < indexOf(outlineModule)`, `< indexOf(keyboardNavModule)`, `indexOf(zoomModule) < indexOf(cullingModule)`, and that `getModules()` last element is `domNotificationsModule` and `getModules()` has `cullingModule` before the first `Viewer.modules` entry. `editor/src/index.test.ts`: same order assertions on `editor.getModules()`. Both fail before (module absent / no `culling` index). Command: `pnpm --filter @d3-polytree/interactive-viewer test`, `pnpm --filter @d3-polytree/editor test`.

---

### Step 19 — Regenerate `styles.generated.ts`

**Status**: `pending`
**Files**:

- `packages/element/src/styles.generated.ts` — modify (generated; never hand-edit)

**Evidence**:

- PLAT-04: "`*.generated.ts` files are committed source … Never hand-edit" (`docs/context-constitution.md:27`).
- `packages/element/scripts/generate-styles.mjs:18-32` concatenates `${interactiveViewerCss}\n${editorCss}` from the built `dist/style.css` and writes `export const shadowCss = …`; `packages/element/package.json:28` `"build": "node scripts/generate-styles.mjs && tsup"`.
- CI drift gate: `.github/workflows/ci.yml:40-51` runs the generators then `git diff --exit-code -- … packages/element/src/styles.generated.ts`.

**Instructions**:
After Step 18's `pnpm build`, run `node packages/element/scripts/generate-styles.mjs` and commit the resulting `styles.generated.ts` change in the **same PR/commit group** as Step 18.

**Verification**:
`node packages/element/scripts/generate-styles.mjs && git diff --exit-code -- packages/element/src/styles.generated.ts` exits 0 after committing; `pnpm --filter @d3-polytree/element test`.

**Test**:
N/A (generated artifact; drift is the existing CI gate).

---

### Step 20 — Palette placement fix

**Status**: `pending`
**Files**:

- `packages/core/src/features/palette/BaseAddHandler.ts` — modify
- `packages/core/src/features/palette/baseAddHandler.test.ts` — create

**Evidence**:

- `BaseAddHandler.ts:27-33` `_getElemOfReference()` (first `drawingRegistry.getAll()` element's `<g>`, else the drawing layer); `:35-52` `_calculatePosition(): Point` using `getBoundingClientRect` of the container and the reference element and `canvas.getTransform` (`scale = canvasTransform.a || 1`; `x = (-1.0 * (refRect.left - translateX * scale - (container.left + container.width / 2))) / scale`, y analogous); `:63-65` `append(parameters)` sets `parameters.position = this._calculatePosition();`.
- Algebraically the old result equals `(cw/2 − tx)/k − localLeft`, `localLeft` ≈ 3–4 world px (outline/translate/stroke); a culled reference element has an empty rect.
- Existing palette tests (`palette.test.ts`, 182 lines) only use `vi.fn()` stubs for `Palette`/`PaletteProvider`; **no test exists for `_calculatePosition`** (digest §7). Canvas size helper `Canvas.getSize()` `:121-126`; `canvas.getTransform` falls back to identity in jsdom (`Canvas.ts:108,116`).

**Instructions**:
Replace the body of `_calculatePosition` with the center of the viewport in world coordinates, no element rect: read `const { width, height } = this._canvas.getSize(); const t = this._canvas.getTransform(); const k = t.a || 1; return { x: (width / 2 - t.e) / k, y: (height / 2 - t.f) / k };`. Remove `_getElemOfReference` and now-unused imports (`select`, `GroupSelection` (imported at `BaseAddHandler.ts:4`), and `DrawingRegistry` only if no other use in the file — grep each before deleting). Keep `append`'s `parameters.position = this._calculatePosition();` untouched.

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/palette`; `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
`baseAddHandler.test.ts` — create: a concrete subclass of `BaseAddHandler`; stub `canvas.getSize` and `canvas.getTransform` (`vi.spyOn`) for 3 zoom scales × 3 pans and assert `(width/2 − e)/a`; assert the result is independent of `drawingRegistry` content (empty registry and a registry whose first `<g>`'s `getBoundingClientRect` is stubbed to a zero rect give the same position — the culled-element case); and an old-vs-new comparison using a local copy of the old formula with stubbed rects, `|Δ| ≤ 4` world px. Command: `pnpm --filter @d3-polytree/core test`. Fails before (old code depends on the stubbed rect).

---

### Step 21 — Random-sequence property test (index ⇄ model consistency)

**Status**: `pending`
**Files**:

- `packages/editor/src/culling.property.test.ts` — create

**Evidence**:

- No `fast-check` dependency and no shared PRNG (digest §8): hand-rolled deterministic sweeps are the norm (`route/route.test.ts:60-64,70`); `outline.test.ts:11-27` and `drawerTestUtils.ts:8-30` (`makeDef`, `makeServices`) are the drawer/canvas test helpers; `modelling/orchestrator.test.ts`, `modelling/modelling.test.ts` and `editor/src/command.roundtrip.test.ts` exercise the real Modelling + CommandStack path.
- Write-set inventory: design §10 (every geometry writer and its emitted event); ledger 2026-09-17: a syntactic tripwire cannot prove totality, a behavioural sequence test can.
- Events: `<cls>.created/.updated/.removed/.moving` (`BaseElement.ts:94,137,149`; `drag.ts:162-167`); undo/redo re-create ids (`commands.ts:73-79`).

**Instructions**:
Use a real `Editor` (jsdom) — it composes the drawers, `Modelling`, `CommandStack` and (via `interactionModules`, Step 18) `Culling`; `packages/core/src/modelling/orchestrator.test.ts` uses spy handlers and a fake command stack, so it is NOT the model — read `packages/editor/src/command.roundtrip.test.ts` for the real-Editor + undo/redo setup and mirror it (the test therefore lives in the `editor` package, which reads built `dist` of the packages below it — rebuild core, canvas, interactive-viewer first), stub `getSize`/rAF as in Step 15, and run seeded (inline mulberry32) random sequences of: create node/label/link, move (`element.move`), resize, delete, undo, redo, autoLayout, label text edit, pan/zoom (`zoom.setZoom` with zoomable on), destroy. After each op + manual rAF flush assert: (1) for every drawn id `index bounds == elementBounds(def)` of the current model; (2) slot flag equals DOM attribute presence; (3) no culled element's bounds intersect the padded viewport (idle); (4) no element toggles more than twice per op; (5) no stale `<g>` reference (slot node `isConnected`). Fixed seeds (≥ 12) listed in the test so failures reproduce; boot ONE Editor per test file (≈ `CULL_MIN_ELEMENTS`+200 = 5,200 elements — boot dominates, so do not boot per seed) and run the seeded sequences consecutively against it, each starting from the current state, with an explicit per-test timeout (≥ 240 s). "At idle" means after the hide backlog is drained (flush the manual rAF queue until `backlog` is empty); assert the per-frame hide count never exceeds `HIDE_BUDGET`. **Boot cost:** subclass `Editor` and override `getModules()` to drop ONLY `searchPanelModule` (identify it by its `__init__` token), exactly as the Storybook `FixtureEditor` does (`apps/storybook/src/perf/harness.ts`): `PropertiesPanel` injects `sideTabsProvider`, so `sideTabsModule` cannot be dropped (Deviation Log). Unfiltered, `SearchPanel._render` (`search-panel/SearchPanel.ts:62-68,154-175`) rebuilds the whole list on every `node|link.created/.updated` — O(N² log N), impractical at ~5,200 elements in jsdom; `SideTabs` draws once at construction (`side-tabs/SideTabs.ts:137,150`). **Time-box and bound the remaining O(N²) costs** (`ModellingLinks.rerouteAll` runs on every `commandStack.changed`, `Links.ts:65-67`; `Selection` is O(N) per change): generate every link `pinned` (as the PR1 fixture does) so reroute is a no-op, cap each seeded sequence at ≤ 25 ops, and before fixing the seed count measure the boot + per-op cost in jsdom once and record it in the Deviation Log; if boot exceeds 60 s or the per-op mean exceeds 2 s, STOP and return to the user (options: lower the op count, or drop `Selection`) rather than silently shrinking the element count below `CULL_MIN_ELEMENTS`. Set an explicit per-test timeout too. **Force activation** (otherwise every assertion is vacuous — Culling is inert below `CULL_MIN_ELEMENTS` and while the cached size is 0, Step 16): seed the Editor with a generated diagram of ≥ `CULL_MIN_ELEMENTS` + 200 elements (inline seeded generator; read `CULL_MIN_ELEMENTS` and `CULL_PAD` from `@d3-polytree/core`, Step 10), install `vi.stubGlobal('ResizeObserver', …)` (a class capturing its callback; Culling constructs its observer in its constructor, Step 16) and the manual `requestAnimationFrame` queue **before `new Editor(...)`**, then after `importDiagram` invoke the captured callback once with `[{ contentRect: { width: 1280, height: 800 } }]` (the field Step 16 reads), and assert `editor.get<Culling>('culling').inspect().active === true` before the first op (type the call — `Viewer.get<T>` does not infer, and `pnpm typecheck` covers the test file) (the test fails if activation did not happen). Read slot state via `inspect()` and the pad via `CULL_PAD`.

**Verification**:
`pnpm --filter @d3-polytree/editor test src/culling.property.test.ts`; typecheck; `pnpm lint`; `pnpm format:check`.

**Test**:
The file is the test; it fails if any writer in the design §10 table emits no event Culling consumes (bounds drift). Command: `pnpm --filter @d3-polytree/editor test` (`packages/editor/package.json:24-28`). The op list includes reroute implicitly: every command transaction emits `commandStack.changed` which triggers `ModellingLinks.rerouteAll` (`Links.ts:65-67`).

---

### Step 22 — ssr: no-residue assertion

**Status**: `pending`
**Files**:

- `packages/ssr/src/renderToSvg.test.ts` — modify

**Evidence**:

- `renderToSvg.test.ts:34-38` ("renders a standalone SVG string preserving author-set ids") and `:40-44` (determinism) render `WITH_IDS` (`:5-12`); the file has no golden file, only `toContain`/equality assertions (`:33-68`). ssr renders a plain `Viewer` with no `zoomModule` (`viewer/src/index.ts:76-81`) so Culling is never loaded; `pretendToBeVisual: true` (`ssr/src/dom.ts:23`) gives rAF but size is 0.

**Instructions**:
In the first test add `expect(svg).not.toContain('data-pfd-transient'); expect(svg).not.toContain('display="none"');`. After the test passes, run the whole ssr suite locally (`pnpm --filter @d3-polytree/ssr test`) and rely on CI's pinned-container VR compare (`.github/workflows/visual-regression.yml:84-86`) for the pixel check — baselines are "generated and compared _only_ inside `mcr.microsoft.com/playwright:v<version>-noble` … never on a dev host" (`apps/storybook/CLAUDE.md:44-46`) — to prove Step 11's title refresh left outputs unchanged.

**Verification**:
`pnpm build && pnpm --filter @d3-polytree/ssr test`; `pnpm lint`; `pnpm format:check`.

**Test**:
This is the test (extends `renderToSvg.test.ts:34-38`). It passes before and after — it is a regression tripwire; the **separate** check that it would fail on residue is done by temporarily adding the attribute in a local run (record in the Deviation Log only if behaviour differs).

---

### Step 23 — `culling.spec.ts`: required correctness lane (G1–G6)

**Status**: `pending`
**Files**:

- `apps/storybook/playwright/culling.spec.ts` — create
- `apps/storybook/playwright/_support.ts` — modify (add a no-reduced-motion navigation helper)

**Evidence**:

- Runs in the existing job: `visual-regression.yml:84-86,122` (`pnpm --filter @d3-polytree/storybook test:e2e`); `fullyParallel: true`, 2 workers in CI (`playwright.config.ts:21,24`); default timeout 30 s (no global timeout) ⇒ per-test `test.setTimeout(90_000)` (one ≈ 10.6k-element boot is ≈ 2.4 s interactive / ≈ 5.2 s Editor, `measurements.md` §3; the long tests are the drain/jitter ones, not boot); seed-missing and compare passes both run it ⇒ no `toHaveScreenshot`.
- `gotoStory` (`_support.ts:55-84`) forces `reducedMotion: 'reduce'` (`:62`), and `Zoom.setInitialZoom` skips the tween under reduced motion (`zoom.ts:113-124`) ⇒ G1b needs its own helper with `reducedMotion: 'no-preference'`.
- Idle semantics: `data-pfd-culling-idle` flips `"true"` between tween frames (design A17) ⇒ a `settled()` helper (persisted `settings.zoom` == target or `zoom.end`, stable ≥ 3 rAFs, then idle `"true"`).
- Axes mutates DOM on gestures (`axes.ts:136` reads `getRootLayer()`; `:62-66,76-89` writes `style` on `.axis`; `_rescale` re-ticks) ⇒ G3's MutationObserver is scoped to the element-group containers (`<cls>-group`, `BaseElement.ts:78-81`).
- Zoom reach: `window.__…Viewer.get('zoom')` (`viewer/src/index.ts:180`, token `'zoom'` `features/index.ts:78`); zoom enabled by `ZoomScroll` (`zoomScroll.ts:12`).
- G4 uses the CDP AX tree (`Accessibility.getFullAXTree`, `context.newCDPSession(page)`), NOT `ariaSnapshot` (verified unreliable for this DOM — see Step 6 Evidence); Playwright 1.56.1. G1: `getBoundingClientRect` excludes stroke (verified), so the oracle adds `stroke-width/2` (and the marker extent) explicitly.
- G2 brute force reuses `elementBounds` from `@d3-polytree/core` (Step 10) — importing core into Playwright's Node process is **VERIFIED 2026-10-07** (both `import()` and `require` of `@d3-polytree/core` succeed from a spec, 111 exports) — import `elementBounds` and `CULL_MIN_ELEMENTS` directly.
- Fixture data from Step 2 (`fixture.data.ts` is Node-safe).

**Instructions**:
Also assert the fixture size against the real threshold (design §7: `count ≥ 2·CULL_MIN_ELEMENTS`) using the exported `CULL_MIN_ELEMENTS` (imported directly from `@d3-polytree/core`). Add to `_support.ts` a `gotoStoryMotion(page, id)` identical to `gotoStory` except `reducedMotion: 'no-preference'`. In `culling.spec.ts` (`test.describe.configure({ mode: 'serial' })`, `test.setTimeout(90_000)`, `loadStories({ includeHarness: true })`, `beforeEach` waits `__polytreeCullingReady`), implement for **both** `viewer: 'interactive'` and `'editor'` arms: **G1** — in the `culling:false` arm at scale 1/offset 0 record every element's `getBoundingClientRect`, inflate by stroke/marker per P2, convert to world rects, map analytically per transform; in the ON arm assert every element whose world rect intersects the strict viewport has no `data-pfd-transient` (zero wrongly-culled). **G1b** — own navigation helper; trigger `zoom.to.element` on a target parked ≥ 1 viewport away; sample every frame in-page; assert ≥ 10 distinct transforms, target culled at start and not culled at end, ≥ 1 element changed state mid-tween, zoom enabled. **G2** — at `settled()`, painted count ≤ brute-force count from `elementBounds` (padded viewport) and no culled element inside the padded viewport. **G3** — MutationObserver on the `<cls>-group` containers, `{subtree, attributes, attributeOldValue}`, `childList == 0`, only `data-pfd-transient` attribute records on `.element`, per-element toggles ≤ 2 after `settled()` (warm-up excluded); **budget gate (A1):** `culling.inspect().stats.maxHides ≤ HIDE_BUDGET` after every scenario (Step 14/15 counter — deterministic; the MutationObserver is used only to assert no `childList` churn and the ≤ 2 toggles/element bound, never to attribute writes to frames), and a first-activation test: read the zoom extent minimum from the live `zoom` service, zoom to `max(fitAll, extentMin)` (fit-all of the ~10.6k fixture is ≈ 0.11 vs a 0.1 extent minimum — assert the target is within the extent and record it), assert ≥ 3 × `HIDE_BUDGET` elements are hidden at the end, `stats.passes` grew by ≥ ⌈hidden/`HIDE_BUDGET`⌉ during the drain, and sampling every rAF frame no element intersecting the strict viewport carries `data-pfd-transient` (G1); **G7 jitter cost (A1, replaces the dual-pad trigger) — RECORD-ONLY:** apply ±1 world-px viewport shifts across a populated pad boundary for 100 frames via `zoom.setZoom(tx ± 1, ty, scale)` (one shift per rAF), count attribute writes per frame (`MutationObserver.takeRecords()` taken in the same rAF tick that applies the next shift) and log `[perf] jitter writes/frame max=… mean=…`; the gate FAILS only on a wrongly-culled element (G1 at every frame). It does not assert the `HIDE_BUDGET / 10` figure: on the regular-grid fixture ≈ 54 nodes share each column, so ~200 elements straddle any boundary and PR1 measured ≈ 200 toggles — the cost-based trigger of design §9 is evaluated by a human from the recorded numbers (if mean writes/frame > `HIDE_BUDGET / 10` the dual-pad hysteresis is proposed to the user, not auto-promoted). **G4** — via the CDP AX tree: in the OFF arm the sampled id's AX node exists with the expected `name` (e.g. `label: <text>`, `node (default)`), then `(role, name)` + `[element-id]` count per id equal ON vs OFF and total AX node count unchanged (`ariaSnapshot` informational only) for sampled culled/unculled ids incl. an off-screen-edited label; `focus()` on a culled `<g>` → `activeElement`; search-panel activate and arrow-cone nav reach culled elements. **G5** — `exportSVG()` ON byte-identical to OFF, same browser, same state. **G6** — computed `display:none` on a culled element's `.innerElement`; and a second test with CSS aborted before navigation (`page.route('**/*.css', r => r.abort())` or `addInitScript`) asserting painted count == total and exactly one `console.warn`.

**Verification**:
`pnpm build && pnpm build-storybook && pnpm --filter @d3-polytree/storybook test:e2e culling`; `pnpm --filter @d3-polytree/storybook typecheck`; `pnpm lint`; `pnpm format:check`.

**Test**:
The spec is the test (each gate fails on a mutated build: e.g. temporarily shrink the pad to 0 → G1 fails; remove the clone strip → G5 fails; drop the label reveal → label outline box is 0×0). Command: `pnpm --filter @d3-polytree/storybook test:e2e`.

---

### Step 24 — Blocking frame-time ceiling and `perf.yml` enforcement

**Status**: `pending`
**Files**:

- `apps/storybook/playwright/perf.spec.ts` — modify
- `apps/storybook/playwright/perf-budget.json` — create
- `.github/workflows/perf.yml` — modify

**Evidence**:

- User decision G-DF2: the frame-time assertion is **blocking from day one** (design §7/Waivers); safeguard: if PR1's separation `(off median p95 − on max p95) < 2× on-arm spread`, do **not** merge a blocking ceiling silently — return to the user (DF-2).
- Budget = max ON-arm p95 over ≥ 5 CI runs × the margin fixed from `measurements.md`, committed with provenance (image, commit, n).
- `perf.yml` created in Step 8 with `continue-on-error: true` (PR1 only); required-check status is a GitHub branch-protection setting (not in the repo) — **Not found** in-repo; state it in the PR description.
- `TaskDuration` is main-thread only (raster excluded) — keep that note in the spec header.

**Instructions**:
First run the ON-arm perf spec ≥ 5 times in CI (re-run the workflow; collect `perf.json`), update `measurements.md` with the separation verdict. **Branch:** if separation ≥ 2× spread → write `perf-budget.json` `{ metric, budgetMs, margin, provenance: { image, commit, n } }`, make `perf.spec.ts` assert `p95 ≤ budgetMs` for the ON arm (and still record the OFF arm), and remove `continue-on-error` from `perf.yml`; if not → stop and ask the user (do not weaken the gate unilaterally). Keep `retries: 0` for the perf project (Step 4).

**Verification**:
`PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --project=perf` passes locally in the pinned container image; a deliberate regression (e.g. run with `culling:false`) fails the assertion; `pnpm lint`; `pnpm format:check`.

**Test**:
The spec assertion is the test; verify it **fails** against the OFF arm (the budget is below OFF p95 by construction of the separation rule). Command: `PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --project=perf`.

---

### Step 25 — PR2 docs and changesets

**Status**: `pending`
**Files**:

- `packages/interactive-viewer/CLAUDE.md` — modify
- `packages/core/CLAUDE.md` — modify
- `packages/canvas/CLAUDE.md` — modify
- `packages/core/README.md` — modify
- `packages/interactive-viewer/README.md` — modify
- `packages/editor/README.md` — modify
- `packages/canvas/README.md` — modify
- `.changeset/c10-viewport-culling.md` — create

**Evidence**:

- `interactive-viewer/CLAUDE.md:22-23` (stale `getModules()` text), `:25-26` ("`interactionModules` = backgroundColor, zoom, zoomScroll, axes, mouseEvents, selection, outline, then the folded **sideTabs** + **searchPanel** modules." — omits keyboardNav and ariaAnnouncer; real list `src/index.ts:44-61`), `:30-31` (style.scss note).
- `core/CLAUDE.md:26-30` ("Adding a drawer" boot-order bullet), `:39` ("D3 slices are **peer** deps …") — note goes after `:38`/`:39`.
- `canvas/CLAUDE.md` (32 lines): bullets `:25-27` ("`getSvgString` … inlines applicable CSS for a standalone SVG export").
- `packages/core/docs/context-constitution.md` is a context-forge generated artifact (ends "re-run `/context-constitution` to refresh"); it is deliberately NOT edited by this plan (a new CORE rule is not in the approved design).
- READMEs: `core/README.md` `### Features` table `:96-107` (rows `:98,101,102,103`), `### Link routing` pure-helper table `:128-132`; `interactive-viewer/README.md` feature list `:33-50`, `## Styling` `:70-74`, style import `:20`; `editor/README.md` options paragraph `:67-70` ("everything `ViewerOptions` takes, plus `restoreSaved?: boolean`"), Styling `:93-99`; `canvas/README.md` export table `:23-30` (`getSvgString` row `:29`). Template rules: `docs/README-template.md:19-21` (section order), `:28-30` (absolute `/tree/main/` links, no `v2`), `:49-53` (document only real exports), `:60-62` (a README edit needs a patch changeset). element/react: `culling` does **not** flow through them and default-on needs no change (`element/src/index.ts:99` passes only `{container, modules}`; `react/src/index.tsx:154`) ⇒ no README change there.
- Changeset format (commit `02e77ae`): `'@d3-polytree/core': patch` single-quoted front-matter, then a prose paragraph; names kebab-case with roadmap id (e.g. `c2-keyboard-a11y.md`, `c15-coalesced-text-edit-undo.md`); `.changeset/config.json` `"updateInternalDependencies": "patch"`, `"ignore": ["@d3-polytree/storybook"]` (PLAT-07 cascade, `docs/context-constitution.md:30`).

**Instructions**:
Update the stale `interactionModules` list in `interactive-viewer/CLAUDE.md:25-26` to the real order (`backgroundColor, zoom, zoomScroll, axes, mouseEvents, selection, culling, outline, keyboardNav, ariaAnnouncer`, then sideTabs + searchPanel) and fix the `getModules()` sentence to include `domNotificationsModule` last; mention `_culling.scss` at `:30-31`. Add a Culling bullet to `core/CLAUDE.md` (module position before outline, reveal-before-measure for labels, transient-attribute write set = `data-pfd-transient` only, never `status`) and an export-strip bullet to `canvas/CLAUDE.md`. (`packages/core/docs/context-constitution.md` is a context-forge generated artifact and a new CORE rule is not in the approved design — it is NOT edited here; the Culling rules live in `packages/core/CLAUDE.md`. Surface a constitution refresh to the user separately if wanted.) README edits per template: core (Features table row for `culling`, `spatial/` pure-helpers table), interactive-viewer (culling bullet + Styling note: requires the shipped stylesheet, otherwise one warning and no culling, plus the `data-pfd-culling-idle` attribute), editor (`culling?: boolean` option next to `restoreSaved`), canvas (`TRANSIENT_ATTR` row). Create `.changeset/c10-viewport-culling.md`: canvas **minor**, core **minor**, **viewer minor** (the public `ViewerOptions.culling` field, Step 13 — an addition to the design's list, surfaced in the Review Log), interactive-viewer **minor**, editor **minor**, element **patch** (PLAT-07 cascades patches to ssr/react/etc.).

**Verification**:
`pnpm format:check`; `pnpm changeset status` (the `changeset` script is declared at root `package.json:26`, `@changesets/cli` at `:31`) or inspect `.changeset/*.md`; `grep -n "keyboardNav" packages/interactive-viewer/CLAUDE.md`; render-check README links are absolute `https://github.com/davcs86/d3-polytree/tree/main/…`.

**Test**:
N/A (docs/changeset-only).

---

## PR3 — LOD and ceiling

### Step 26 — Label LOD predicate

**Status**: `pending`
**Files**:

- `packages/core/src/features/culling.ts` — modify
- `packages/core/src/features/culling.test.ts` — modify
- `packages/editor/src/culling.property.test.ts` — modify

**Evidence**:

- Zoom-LOD precedent: `tooltip.ts:11` `TOOLTIP_ZOOM_THRESHOLD`, `:42` `canvas.getTransform().a < TOOLTIP_ZOOM_THRESHOLD`; zoom scale extent `[0.1, 15]` (`zoom.ts:14`).
- Label model: `fontSize` default 13 (`pfdn.json:208-211`); labels only — the outline is a hidden child too under A′ so an LOD-hidden label cannot intercept pointer events (design §3/LOD); the design's LOD uses the same attribute with value `"lod"`.
- Threshold is provisional (0.3) and tuned from `measurements.md`; PR1 data decides whether LOD ships at all (design §11).

**Instructions**:
In the rAF pass add a per-label predicate: a label is not-visible when `fontSize × scale < MIN_LEGIBLE_PX` (constant from `measurements.md`; provisional derived from scale 0.3 × fontSize 13) — set `data-pfd-transient="lod"` (distinct from `"culled"`). Revealing removes the attribute; a label both LOD-hidden and outside the viewport stays hidden. The label reveal handler (Step 17) still removes the attribute for `getBBox`. No CSS change (same rule). Document the selected-label caveat.

**Verification**:
`pnpm --filter @d3-polytree/core test src/features/culling.test.ts` and `pnpm --filter @d3-polytree/editor test src/culling.property.test.ts`; typecheck; `pnpm lint`; `pnpm format:check`.

**Test**:
Extend `culling.test.ts`: at scale 0.2 labels in view get `"lod"`, nodes do not; at scale 1 labels reveal; attribute value precedence (`lod` vs `culled`) round-trips without leaking; unchanged flush still zero-write. Extend the property test (Step 21, `packages/editor/src/culling.property.test.ts`) with LOD transitions. Command: `pnpm --filter @d3-polytree/core test`.

---

### Step 27 — LOD gates and perf scenarios

**Status**: `pending`
**Files**:

- `apps/storybook/playwright/culling.spec.ts` — modify
- `apps/storybook/playwright/perf.spec.ts` — modify
- `apps/storybook/playwright/perf-budget.json` — modify (only if the fit-all scenario satisfies the separation rule)

**Evidence**:

- G4/G5 must re-run with LOD on (design §11 PR3); export strip removes any `data-pfd-transient` value (Step 12); keyboardNav/focus behaviour unchanged (`keyboardNav.ts:204-219`).
- Perf scenario: zoom-out to fit-all (the worst case for culling — nothing is outside the viewport; LOD is what helps).

**Instructions**:
Add culling.spec cases at scale below the LOD threshold: label `<g>`s carry `"lod"`, their `<title>` names remain in the `(role,name)` comparison (G4), export parity holds (G5), outline of an LOD-hidden label is not hit-testable (`elementFromPoint` over it hits the node/background, not the label). Add a perf scenario at fit-all and record LOD on/off; extend `perf-budget.json` only if the data shows the fit-all scenario is within the same separation rule (otherwise record informational).

**Verification**:
`pnpm build && pnpm build-storybook && pnpm --filter @d3-polytree/storybook test:e2e culling`; `PERF=1 pnpm --filter @d3-polytree/storybook exec playwright test --project=perf`; typecheck; lint; format.

**Test**:
The spec additions are the tests; command as above.

---

### Step 28 — PR3 docs, ceiling note and changesets

**Status**: `pending`
**Files**:

- `docs/design/2026-10-06-c10-spatial-index-culling-perf/measurements.md` — modify
- `packages/core/README.md`, `packages/interactive-viewer/README.md` — modify
- `ROADMAP.md` — modify
- `.changeset/c10-label-lod.md` — create

**Evidence**:

- `ROADMAP.md` C10 row (`:532`) marked `◐` with the design-approved note (this plan's design commit); design §11 PR3: documented element-count ceiling (overlay stays deferred), LOD scenarios, changesets "core minor, interactive-viewer minor, editor patch".
- Changeset format as in Step 25; `.changeset/config.json` ignore/cascade as above.

**Instructions**:
Record in `measurements.md` the final LOD threshold, the largest fixture size meeting the budget (the documented ceiling past which the overlay deferral should be revisited), and the final trigger outcomes. In the two READMEs describe label LOD (behaviour, threshold, selected-label caveat). Mark C10 ✅ in `ROADMAP.md` with the shipped summary and the recorded non-goals (reroute/boot/SearchPanel/Selection O(N²) untouched). Create `.changeset/c10-label-lod.md`: core **minor**, interactive-viewer **minor**, editor **patch**.

**Verification**:
`pnpm format:check`; `pnpm changeset status` (root `package.json:26`); full CI mirror: `pnpm install --frozen-lockfile && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && node packages/element/scripts/generate-styles.mjs && git diff --exit-code -- packages/element/src/styles.generated.ts && pnpm build-storybook` (`ci.yml:23-54`), then the e2e lane.

**Test**:
N/A (docs/changeset/roadmap-only).

---

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the step number, what changed, and why._

**2026-10-07 — PR1 (Steps 1–9) executed; all steps `done`.** Step bodies above are unchanged (DN-5); divergences:

- **Branch/PR.** The session allows only the one designated branch, so PR1's commits land on `claude/roadmap-next-items-7y0lrz` / PR #93 alongside the RFC docs (not a separate PR1 branch).
- **Step 3 — Editor arm filters only `searchPanelModule`.** `PropertiesPanel` injects `sideTabsProvider` (`packages/editor/src/properties-panel/PropertiesPanel.ts:60`), contributed by `sideTabsModule`, so the Editor cannot boot without side tabs. The interactive arm drops both modules. **Consequence for Step 21** (property test in the `editor` package): filter `searchPanelModule` only — filtering `sideTabsModule` would break the Editor's boot. Also: a `nodes` story arg and a shared `src/perf/harness.ts` were added (needed by Step 7's sweep; not in the step's Files).
- **Step 5 — no "pure background" pan start.** 100% of sampled viewport points hit a link outline rect (`pointer-events: all`; long-range links' first→last-waypoint bbox), so the spec starts the pan at the viewport centre and asserts the drawing-layer `transform` changed instead (`measurements.md` §1).
- **Step 6 — AX assertion is group-role count, not total node count.** Hiding painted children removes a few decorative AX descendants (3 for two elements), so the invariant is that every element's own `group` node (role+name) survives. The overhang probe first measured against the wrong origin (the first `.pfdjs-container svg` is a 20×20 chrome icon); it now uses `canvas.getContainer()`. **P4 is not observable**: the unmodified Editor renders no `.resize-container` handles (also in the stock Interaction Harness) — a pre-existing bug unrelated to C10, queued as a separate task.
- **Step 7 — extra probe and a corrected benchmark.** Added a hide-mechanism variants test (V1–V6, not in the step) after the bulk-write probe showed style recalc dominating; the first jitter model omitted the pad and was fixed; the churn micro-benchmark is noise-level (ratio 1.87× then 2.56× on re-run).
- **Step 8 — `--exclude-tags` does not exist in Storybook 8.6.18**, so the `STORYBOOK_DEPLOY=1`-gated `stories` globs in `.storybook/main.ts` are the primary mechanism (as the Post-review verification already recorded); verified: deploy build omits `Tests/Culling Harness` and `Tests/Perf Harness` and keeps `Tests/Interaction Harness` (10 vs 12 stories).
- **Step 9 — `measurements.md` written; §9 triggers FIRED.** Per Step Dependencies ("Contingency (design §9)") **no PR2 step starts**: (1) chunked/budgeted hides — fired (hiding all 23k `<g>` = 1.2–2.7 s main-thread for every mechanism tried); (2) dual-pad — fires by construction (the trigger as worded cannot not-fire; needs re-wording); (3) free-list — borderline/inconclusive; plus a data-driven change to `CULL_MIN_ELEMENTS` (≈5,000 instead of the provisional 1,000, forcing a ≥ ~10k-element correctness fixture). Returned to the user for a design amendment (DF-2).

## Review Log

**2026-10-07 — verdict: `passed-with-warnings`** (design-buddy plan-review; 3 review passes: initial FAIL, then two fix-and-re-review cycles = the cap).

**Pass 1 — FAIL.** 3 BLOCKERs (`DF-1`, citations that did not resolve), all fixed:

- Step 4 (and Step 23): `apps/storybook/playwright.config.ts` cited past its 50 lines → re-cited to `:18,20,21,23,24,41,43,48`; `apps/storybook/package.json` cited `L143-146` of a 34-line file → `:10-13,27`.
- Step 2: `apps/storybook/src/deterministic.ts:84-86` / `src/sample.ts:87-153` (20- and 67-line files) → `:14-20` / `:12-67`.
- A mechanical scan of `recon.md`, `design.md` and `plan.md` for other out-of-range `path:line` cites found and fixed 17 more in `recon.md`/`design.md` (e.g. `keyboardNav.ts:255` → `:50`, `selection.ts:127` → `:31`) and the module key typo `__init:` → `__init__:` in `design.md`; `BaseAddHandler.ts:36-52` → `:35-52`.

**Pass 1 warnings — addressed (amendments to step bodies, pre-execution, allowed by DN-5):**

- Step 1 test is vacuous until Step 3 — stated; behavioural teeth moved to Step 3 (`harness-filter.spec.ts` extended).
- Arm selection (culling on/off, interactive/editor) — Step 3 adds `args` plumbing to `iframeUrl`/`gotoStory` (`_support.ts` now in Files) with a named-export fallback.
- Required-lane safety — Step 6's spec is small-fixture only with a 60 s timeout; the 23k bulk-write probe moved to Step 7.
- Pad / `CULL_MIN_ELEMENTS` data gap — Step 6 measures per-class painted-extent overhang, Step 7 sweeps `CULL_MIN_ELEMENTS`; the pad is marked provisional with G1 (Step 23) authoritative.
- Design deviation surfaced (DF-2): the separation verdict moves from PR1 (no ON arm exists) to Step 24; a contingency for any fired §9 trigger added to Step Dependencies.
- Added `zoom.test.ts` to Step 15, the fixture-size vs `CULL_MIN_ELEMENTS` assertion to Step 23, Steps 2/6/10/11/12/13–17 to Step 23's dependencies.
- Files-list mismatches fixed (Steps 2, 3, 8, 13, 15, 23, 26, 27); wrong-line cites fixed (Step 1 constitution path, Step 3 `zoom.ts:73-75`, Step 10/14 `core/package.json:25`, Step 23 `axes.ts:136`); `changeset` script cited (`package.json:26,31`).
- **Scope additions (not in the approved design, surfaced here):** Step 13 now updates `packages/viewer/README.md` and `packages/viewer/CLAUDE.md`, and Step 25's changeset gains **viewer: minor** (public `ViewerOptions.culling`). **Scope removal:** the proposed `CORE-06` edit to the context-forge-generated `packages/core/docs/context-constitution.md` was dropped (not in the design; Culling rules live in `packages/core/CLAUDE.md`).
- Step 21 moved from `core` to the `editor` package (a real `Editor` + `CommandStack` is the only demonstrated undo/redo setup, `packages/editor/src/command.roundtrip.test.ts`); Step 22's pixel check now defers to the pinned-container CI compare.

**Pass 2 / pass 3 — PASS WITH WARNINGS (no blockers); warnings addressed:**

- Step 21 activation: a read-only `inspect()` accessor (Step 14) and exported `CULL_MIN_ELEMENTS`/`CULL_PAD` (Step 10, declared in `spatial/types.ts`) added; activation forcing specified (≥ `CULL_MIN_ELEMENTS`+200 seeded elements, `ResizeObserver` + rAF stubs installed before `new Editor`, callback invoked with `[{ contentRect: { width: 1280, height: 800 } }]`, typed `editor.get<Culling>('culling')`); Step 16 now states the RO callback re-evaluates `active`.
- Step 21 boot cost: the test's `Editor` subclass filters `searchPanelModule` only (`sideTabsModule` is required by `PropertiesPanel`; superseded by the A1 re-review amendment of Step 21, which also pins links and time-boxes boot/op cost). **This last amendment was not re-reviewed** (review cap reached); it mirrors Step 3's already-reviewed filtering.
- Step 14's Test gains an `inspect()` case; Step 7 now requires Steps 5–6; Step 6 records the PR-description note that P1/P3 turn PR1's required check red by design.

**Waivers:** none. **Remaining UNVERIFIED items:** none from the original list — see "Post-review verification" below.

### Post-review verification (2026-10-07, after `pnpm install --frozen-lockfile`)

All previously UNVERIFIED items were checked against the installed tree and a real Chromium (Playwright 1.56.1, throwaway story/spec, since deleted — nothing committed). Results and the plan amendments they caused (pre-execution; DN-5 allows amendments with a log entry):

| Item                                              | Result                                                                                                                                       | Plan effect                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| d3-selection `selectChild`                        | present (`d3-selection@3.0.0` `src/selection/index.js:3,55`)                                                                                 | Step 11 unchanged; evidence marked verified                                                                             |
| `storybook build --exclude-tags` (8.6.18)         | **does not exist**                                                                                                                           | Step 8: `STORYBOOK_DEPLOY=1`-gated `stories` globs in `.storybook/main.ts` is now the primary mechanism (Files updated) |
| `&args=` URL param (html-vite 8.6.18)             | works; `culling:!false` and `culling:false` both give boolean `false` when declared in `argTypes`; `viewer:interactive;culling:!false` works | Step 3: marked confirmed; `argTypes` declaration required                                                               |
| Custom tag in `index.json`                        | `tags: ["dev","test","harness-only"]`                                                                                                        | Step 1/3 filter premise confirmed                                                                                       |
| `culling` passed to `Editor` before Step 13       | typechecks (`ViewerOptions` index signature)                                                                                                 | Step 3 ordering confirmed                                                                                               |
| Import `@d3-polytree/core` from a Playwright spec | works via `import()` and `require` (111 exports)                                                                                             | Step 6 reduced to a guard; Step 23 imports core directly; `CullingHarness` in-page fallback removed from Step 23 Files  |
| P1 AX name with all children hidden               | CDP AX tree unchanged (157 nodes before/after); `<g>` stays `group` named from `<title>`                                                     | contingency not triggered; Step 6 asserts via CDP                                                                       |
| `locator.ariaSnapshot()` as AX oracle             | **unreliable**: `"- img"` visible vs `""` hidden for the same `<g>`                                                                          | G4 (design §7, Steps 6/23) uses CDP AX tree; `ariaSnapshot` informational                                               |
| P3 `focus()` on culled `<g>`                      | `activeElement === g`                                                                                                                        | confirmed                                                                                                               |
| P2 `getBoundingClientRect` includes stroke        | **no** (unchanged at `stroke-width: 40`)                                                                                                     | Step 23 G1 inflates the oracle by stroke/2 + marker explicitly                                                          |
| CDP `Performance.getMetrics`                      | `Layout/RecalcStyle/Script/TaskDuration` available                                                                                           | Step 5 unchanged                                                                                                        |

Still not run (need implementation): the P4 live-resize probe, the 23k fixture boot, and every perf number. `design.md` G4 row and the P1/P3 Open Risk were updated to match.

### Amendment A1 (2026-10-07, user-directed after PR1's measurements)

PR1 (Steps 1–9) fired the design §9 contingency, so the user directed: adopt budgeted hides, set `CULL_MIN_ELEMENTS` = 5,000 with a ≥ ~10.6k correctness fixture, reword the dual-pad trigger cost-based, and re-measure free-list reuse in PR2. `design.md` was amended in place (Amendment A1 section + §3, §7, §8, §9, §11, Open Risks, Waivers). Plan changes — **pending steps only; executed Steps 1–9 are untouched (DN-5)**:

- **New Step 10a** — resize `SMALL` to 10,598 drawn elements (`fixture.data.ts`, `fixture.spec.ts`, `apps/storybook/CLAUDE.md`); Total Steps 28 → 29; Step 23 now requires Step 10a.
- **Step 10** — exports `CULL_MIN_ELEMENTS` = 5000, `CULL_PAD` = 7, `HIDE_BUDGET` = 300 (constants asserted by a test); free-list churn benchmark (≤ 2× else add the free-list, pre-approved).
- **Step 15** — rAF pass is hide-budgeted (`HIDE_BUDGET` hides per frame, ascending slot order, rescan each frame, backlog counts as dirty; shows unbounded); budgeted-drain tests; core tests mock the constants to keep fixtures tiny.
- **Step 16** — idle `"true"` requires no backlog; one real-constants test (inactive at 4,999 slots, active at 5,000).
- **Step 21** — one Editor booted per test file (≈ 5,200 elements), ≥ 12 seeds run consecutively, drain-aware "idle", per-frame budget assertion.
- **Step 23** — 90 s per-test timeout kept (≈ 10.6k-element boot is seconds); budget gate and first-activation drain test; **G7** jitter-cost gate (replaces the dual-pad trigger).
- Design **Open Risks** gained: unbounded SHOW cost (~2 s to reveal all 23k), the hide-drain window (≈ 75 frames), and the local-vs-pinned recheck of the two measured constants.

**Re-review of the amended steps:** _pending_.
