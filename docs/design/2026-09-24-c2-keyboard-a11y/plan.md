# Implementation Plan: c2-keyboard-a11y

**Status**: `pending`
**Created**: 2026-09-24
**Design**: [design.md](./design.md)
**Test harness**: `pnpm --filter @d3-polytree/core test` (vitest); `pnpm --filter @d3-polytree/storybook test:e2e` (Playwright a11y + interaction — `apps/storybook/playwright`, run in CI by `.github/workflows/visual-regression.yml`).
**Total Steps**: 6
**Review**: `passed-with-warnings @ 2026-09-24`

---

## Execution Summary

Land the shared core pieces first (per-element names, the graph helper, the reduced-motion guard — Steps 1–3), then the two interactive-viewer modules that consume them (keyboardNav incl. `role="application"` + focus ring — Step 4; announcer — Step 5), then the axe story + Playwright interaction spec + changesets + CI parity (Step 6). `role="application"` and its Escape hatch ship in this PR (user gate decision); the interaction spec is the CI guard for exitability that axe cannot provide.

## Step Dependencies

- Step 4 requires Steps 1–2 (roving/cone use per-element `<g>`s and `buildModelGraph`).
- Step 5 is independent of Step 4 but shares the boot-order/registration edit.
- Step 6 requires Steps 4–5.

---

### Step 1 — Per-element `<title>`/`<desc>` in the draw layer

**Status**: `pending`
**Files**:
- `packages/core/src/draw/BaseElement.ts` — modify

**Evidence**:
- `appendElement` creates the element `<g>` and `.innerElement`, emits `<class>.created` (`BaseElement.ts:104-119`). Drawers select children by class/tag, none positionally on the element `<g>` (Zones `select('rect')` + drawing-layer insert `Zones.ts:50,66`).
- ssr assertions are prefix/contains/determinism/count, no golden files (`packages/ssr/src/renderToSvg.test.ts:36-59`).

**Instructions**: Add a pure `accessibleName(definition)` helper (element class + `def.get('type')`/text/`name` when present; never empty — falls back to class). In `appendElement`, prepend `<title>` (= `accessibleName`) and `<desc>` (= element id) as the **first two children** of the element `<g>`, before `.innerElement`.

**Verification**: `pnpm --filter @d3-polytree/core test && pnpm --filter @d3-polytree/ssr test` green (ssr `toContain`/determinism unaffected); a new core draw test asserts a rendered node `<g>` contains a `<title>`/`<desc>`.

**Test**: extend an existing `packages/core/src/draw/*.test.ts` (Nodes) to assert the `<title>`/`<desc>` presence + content; assert determinism (same def → same title).

---

### Step 2 — Shared `buildModelGraph` + refactor `AutoLayout`

**Status**: `pending`
**Files**:
- `packages/core/src/model/graph.ts` — create
- `packages/core/src/features/autoLayout.ts` — modify
- `packages/core/src/model/graph.test.ts` — create

**Evidence**:
- `_buildGraph` (`autoLayout.ts:84-102`): nodes mapped in input order to `{id,width,height}` via `_sizeOf`; edges from `definitions.link ?? []` (`:90`) filtered by `!!source && !!target` **and** `ids.has(source) && ids.has(target)` (`:97-100`); liveness via `drawingRegistry.get(id) !== false`.
- `autoLayout.test.ts` asserts className/int-coords/label-lockstep/endpoint-filter, **not** exact positions or node order.

**Instructions**:
1. Create `buildModelGraph(input: { nodes; links; isLive: (id)=>boolean; sizeOf?: (def)=>number }): LayoutGraph` reproducing `_buildGraph` exactly — nodes in input order → `{ id, width: (sizeOf??()=>1)(n), height: same }`; edges from `links` filtered by `isLive(l.id)` **and** both endpoint ids present in the node-id set. Pass `links = definitions.link ?? []`.
2. Refactor `AutoLayout._buildGraph` to delegate: `buildModelGraph({ nodes, links: this._model.definitions.link ?? [], isLive: id => this._drawingRegistry.get(id) !== false, sizeOf: n => this._sizeOf(n) })` — byte-identical output.
3. Export `buildModelGraph` from core (`features`/`model` barrel → `core/src/index.ts`); if it becomes a public export, note it in the core README per the template's "real exports" rule.

**Verification**: `pnpm --filter @d3-polytree/core test` green — existing `autoLayout.test.ts` unchanged and passing (proves byte-identical); `graph.test.ts` green.

**Test**: `graph.test.ts` — node set + **order**; `width`/`height` = `sizeOf` (non-default e.g. 40, and the `()=>1` default); edge set; **an edge whose endpoint id is absent from the node set is dropped** (the load-bearing `ids.has()` filter); an edge with `isLive`=false dropped; empty input → `{nodes:[],edges:[]}`.

---

### Step 3 — `prefers-reduced-motion` guard in `zoom.ts`

**Status**: `pending`
**Files**:
- `packages/core/src/features/zoom.ts` — modify

**Evidence**: `setInitialZoom` animated vs instant branch `zoom.ts:108-118` (instant `.call(...)` at `:116`); `ZOOM_TO_DURATION=1800` `:18,181-186`.

**Instructions**: Add a module-level `prefersReducedMotion()` = `typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches`. In `setInitialZoom`, when it returns true, take the existing instant branch (pass `duration` 0 / skip `.transition()`).

**Verification**: `pnpm --filter @d3-polytree/core test` green; a test stubbing `matchMedia` asserts the instant path is taken when reduced-motion is on.

**Test**: extend `packages/core/src/features/zoom.test.ts` (or add one) asserting no `.transition()` under reduced-motion.

---

### Step 4 — `keyboardNavModule` (role=application, roving, cone, focus ring, Escape) + focus SCSS

**Status**: `pending`
**Files**:
- `packages/core/src/features/keyboardNav.ts` — create
- `packages/core/src/features/index.ts` — modify (export the module)
- `packages/interactive-viewer/src/index.ts` — modify (register ahead of drawers)
- `packages/interactive-viewer/src/_focus.scss` — create
- `packages/interactive-viewer/src/_tokens.scss` — modify (define the token)
- `packages/interactive-viewer/src/style.scss` — modify (`@import './focus'`)

**Evidence**:
- svg + lifecycle: `Canvas.ts:55-59,62-64`; per-element `<g>` `BaseElement.ts:104-119`; `def.position` `draw/definitions.ts:40-44`; `DrawingRegistry.get` `DrawingRegistry.ts:15-17`.
- feature-module pattern + `static $inject`: `selection.ts:22,87-94`, `autoLayout.ts:32`; module list `interactive-viewer/src/index.ts:36-48`; boot order `Diagram.ts:65-66`.
- Outline two-part rect + forced-colors precedent `outline.ts:63-96`, `_outline.scss:9,17-22,28-33`; invariant token mixin `_tokens.scss:17`; `style.scss` @import list `:3-7`; sass build `interactive-viewer/package.json:25`.

**Instructions**:
1. `keyboardNav.ts` — class with `static readonly $inject = ['canvas','eventBus','d3polytree','selection']`; on `canvas.init` set `role="application"` + defaulted `aria-label` + `tabindex="0"` on `canvas.getSVG()`. Maintain a `Map<id,{g,def,cls}>` from `<class>.created`/pruned on `.removed`; roving `tabindex` (svg=0, gs=-1, current=0). Arrow keys: direction-cone next-target from `def.position` (using `buildModelGraph` edges for adjacency bias), move roving `tabindex`, `.focus()` the target `<g>`, add `.pfd-focus`, and call `selection.select(g, def)`. Append a `<rect class="element-focus-ring">` as the **last** child of each `<g>` and re-assert on `<class>.updated` (idempotent by class). **Escape**: remove `.pfd-focus`, reset the roving pointer, and move focus to the `<svg>` entry, then **`blur()` it** so `document.activeElement` leaves the `role="application"` region (a bare container `<div>` is not focusable without `tabindex`, so blurring the roving `<g>`/svg is what actually releases AT forms mode — plan-review warning). Never `preventDefault` Tab. Export a `keyboardNavModule` object `{ __init__: ['keyboardNav'], keyboardNav: ['type', KeyboardNav] }` (eager `__init__` so it subscribes to `<class>.created` before the drawer storm — host boot-order rule).
2. Export `keyboardNavModule` via `features/index.ts`.
3. Register `keyboardNavModule` in `interactionModules` **ahead of** `Viewer.modules` (`interactive-viewer/src/index.ts:36-48`); keep `domNotificationsModule` last.
4. `_tokens.scss`: add `--pfd-color-focus-ring: #1a73e8;` inside the `pfd-tokens-invariant` mixin (beside `--pfd-color-selection`).
5. `_focus.scss`: base `.element-focus-ring { fill:none; stroke-width:0; }`; `.element.pfd-focus > .element-focus-ring { stroke-width:1px; stroke: var(--pfd-color-focus-ring, #1a73e8); }`; `@media (forced-colors: active){ .element.pfd-focus > .element-focus-ring { stroke: LinkText; forced-color-adjust:none; } }`.
6. `style.scss`: add `@import './focus';` after `./outline`.

**Verification**: `pnpm --filter @d3-polytree/core typecheck && pnpm --filter @d3-polytree/interactive-viewer build` (sass compiles `_focus.scss` into `dist/style.css`); interaction behavior verified in Step 6.

**Test**: unit-test the module's roving/cone selection in jsdom where feasible (focus/select on synthetic `<g>`s); full behavior in Step 6's Playwright spec.

---

### Step 5 — `ariaAnnouncerModule`

**Status**: `pending`
**Files**:
- `packages/core/src/features/ariaAnnouncer.ts` — create
- `packages/core/src/features/index.ts` — modify (export)
- `packages/interactive-viewer/src/index.ts` — modify (register ahead of drawers)

**Evidence**: DomNotifications container-build + role pattern `DomNotifications.ts:26-29`; announce sources `selection.changed` `selection.ts:61`, lifecycle `<class>.created`/`.removed` `BaseElement.ts:95,118`; boot latch `canvas.init` `Canvas.ts:62-64` (after storm, `Diagram.ts:65-66`).

**Instructions**: `ariaAnnouncer.ts` — `static readonly $inject = ['canvas','eventBus']`; build a visually-hidden `aria-live="polite"` `<div>` in the container; subscribe to `selection.changed` (→ `"{name} selected"`/`"{n} selected"`/`"selection cleared"`) and **post-boot** `<class>.created`/`.removed` (→ `"{name} added"`/`"{name} removed"`); latch on `canvas.init` so the boot render is silent; never announce `.updated`/`.moving`. Export a `ariaAnnouncerModule` object `{ __init__: ['ariaAnnouncer'], ariaAnnouncer: ['type', AriaAnnouncer] }` (eager) + register in `interactionModules` (order relative to keyboardNav does not matter; both ahead of drawers, domNotifications last).

**Verification**: `pnpm --filter @d3-polytree/core test` green; a jsdom test asserts the live region text updates on a `selection.changed` emit and is silent during boot.

**Test**: `packages/core/src/features/ariaAnnouncer.test.ts` — asserts the region content on select/deselect and boot-silence.

---

### Step 6 — a11y story, Playwright interaction spec, changesets, CI parity

**Status**: `pending`
**Files**:
- `apps/storybook/src/*.stories.ts` — modify/create (an interactive-viewer a11y story)
- `apps/storybook/playwright/interactions.spec.ts` — modify
- `.changeset/c2-keyboard-a11y.md` — create
- `ROADMAP.md` — modify (C2.a follow-up note; leave C2 status per the design)

**Evidence**: axe gate `a11y.spec.ts:24`, baseline `_a11y.ts` empty; harness live Editor + `g[element-id]` locators `InteractionHarness.stories.ts:31,49`, `interactions.spec.ts:31`; reduced-motion emulation `_support.ts:62`.

**Instructions**:
1. Add/confirm an interactive-viewer story rendering the labeled `role="application"` svg with per-element `<title>` so axe sees a valid role + name (baseline stays empty).
2. `interactions.spec.ts`: **Case A** — focus `.pfdjs-container svg`; ArrowRight → `document.activeElement` is a real `g[element-id]` (truthy id), a **second** ArrowRight yields a *different* `element-id` (proves traversal), and the target `<g>` gains `.selected`. **Case B** — Escape → `document.activeElement` is **not** the svg and **not** any `g[element-id]` (out of the application region); Tab → `activeElement` is no longer inside the diagram.
3. Create the changeset (patch across the packages whose published output changes):
   ```md
   ---
   "@d3-polytree/core": patch
   "@d3-polytree/viewer": patch
   "@d3-polytree/ssr": patch
   "@d3-polytree/interactive-viewer": patch
   "@d3-polytree/editor": patch
   "@d3-polytree/element": patch
   ---
   Keyboard-first accessibility for the diagram: role="application" with roving
   focus, arrow-cone navigation, an Escape hatch out of application mode, an
   aria-live announcer, per-element accessible names (<title>/<desc>, also in SSR
   output), a forced-colors focus ring, and reduced-motion-aware zoom. AT
   forms-mode navigation is verified structurally (axe) and behaviourally
   (Playwright); a manual screen-reader pass is recommended (tracked as ROADMAP C2.a).
   ```
4. `ROADMAP.md`: add a `C2.a` sub-note (manual real-AT verification of forms-mode navigation) so the residual is tracked.

**Verification**: `pnpm --filter @d3-polytree/storybook build-storybook && pnpm --filter @d3-polytree/storybook test:e2e` (axe + interaction) green; then full CI mirror `pnpm install --frozen-lockfile && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook`.

**Test**: the Playwright interaction spec is the test (real Chromium).

---

## Review Log

### 2026-09-24 — plan-review — passed-with-warnings

- **Verdict**: PASS WITH WARNINGS (reviewer agent); no blockers. Boot latch verified valid (storm before `canvas.init`); role=application/DN-9 waiver honored; token/SCSS/`$inject`/CI-mirror evidence all resolve.
- **Warning 1 (addressed)**: changeset excluded `editor` on a self-defeating rationale (editor's `style.scss` imports the `tokens` partial, so its CSS *does* change) → Step 6 changeset now lists `@d3-polytree/editor: patch` explicitly.
- **Warning 2 (addressed)**: Escape moving focus to a non-focusable `<div>` is a no-op (residual trap) → Step 4 now `blur()`s the roving element/svg so `document.activeElement` truly leaves the application region (guarded by Step 6 Case B).
- **Warning 3 (addressed)**: module `__init__` not spelled out → Steps 4–5 now specify eager `__init__: ['keyboardNav']`/`['ariaAnnouncer']` module objects (subscribe-before-storm).

---

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the step number, what changed, and why._
