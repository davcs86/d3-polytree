# Recon: c10-spatial-index-culling-perf

**Created**: 2026-10-06
**Change**: C10 (ROADMAP §11, closes H6) — spatial index over element bounds, zoom-driven viewport culling, RAF-coalesced enter/update/exit, level-of-detail below a zoom threshold, optional canvas overlay past ~5k elements, enforced by a CI frame-time assertion on a 10k-node fixture.
**Depth**: deep (user-confirmed at B3)
**Affected areas**: `packages/core/src/draw`, `packages/canvas/src`, `packages/core/src/features` (+ `interactive-viewer` search-panel), `packages/core/src/modelling` + `route` + `command`, `packages/ssr`, `apps/storybook` (+ `.github/workflows`)

> Provenance: assembled from one repo-scout digest and four area-discovery digests (Explore agents standing in for the unregistered `design-buddy:*` agent types). Line numbers are as reported by those digests; items they flagged as unread are under Risks / Not-found. A few `:~` approximations are carried as given.

---

## Repo Profile

pnpm + Turborepo TypeScript/ESM monorepo (`@d3-polytree/*`, D3 v7 slices as peers, didi DI). Layering: canvas/layout/pfdn-moddle → core → viewer → interactive-viewer → editor; ssr, element, react, icons-amazon, diff alongside. Tests: `pnpm test` = vitest/jsdom per package (`packages/core/vitest.config.ts`); e2e/VR/a11y/interaction is a **separate** Playwright lane (`apps/storybook`, `visual-regression.yml`, container `mcr.microsoft.com/playwright:v1.56.1-noble`), deliberately not in `turbo run test`. CI `ci.yml`: install → lint → format → typecheck → test → build → generated-files check → build-storybook. No coverage threshold. **No perf/benchmark/frame-time tooling, quadtree, culling, LOD, RAF or `<canvas>` exists anywhere.**

## Codebase Map

- **`packages/core/src/draw`** (TS)
  - Entry: `BaseElement.ts` — `_init` :160-168, `appendElement` :118-138 (emits `<cls>.created` :137), `updateElement` :140-150 (`.updated` :149), `removeElement` :84-97 (`.removed` :94 _before_ `elem.remove()` :95; by-id path passes a bare `{id}` :99-101).
  - Registries: `DrawingRegistry.ts:4-22` (Map id→`<g>` selection), `canvas/src/ElementRegistry.ts:35-81`.
  - Z-order by DOM insert-before per container: Zones `Zones.ts:316-324`, Links `Links.ts:182-190`, Nodes `Nodes.ts:75-83`, Labels append.
  - Geometry **without `getBBox`** (jsdom-safe): node `position`+`size` (`definitions.ts:40-44`), link `waypoint[]` (`definitions.ts:32-37`), zone `position/width/height` (`definitions.ts:16-29`), label `position/fontSize/text` only — **no width/height in model** (`definitions.ts:9-14`).
  - Analogue: `Outline` (`features/outline.ts:25-96`).
  - Tests: `drawerTestUtils.ts` (`makeDef`, `makeServices`), `BaseElement.test.ts`, `Nodes/Links/Labels/Zones.test.ts`, `DrawingRegistry.test.ts`.
- **`packages/canvas/src`** (TS)
  - `Canvas.ts:55-60` (svg > `g.full-group`), `getRootLayer` :92, `getDrawingLayer` :96, `getTransform` :105-119 (**jsdom → identity**; allocates a `<g>` per call :112), `getSize` :121-126 (clientWidth/Height; 0 in jsdom).
  - Events typed in `events.ts` (`canvas.zoomed` :84 no payload; `zoom.preZoom/start/end/init` :98-101; `commandStack.changed` :103).
- **`packages/core/src/features`** (TS)
  - Zoom: `zoom.ts` — single writer `setZoom` :78-102 (emits `zoom.preZoom` :79, writes `transform` :91, persists to model :94-98, emits `canvas.zoomed` :100); d3-zoom `zoom` handler unthrottled :142-148; scaleExtent [0.1,15] :14; `zoom.to.element` :167-194 (model-geometry only; 1800 ms tween :18).
  - **No subscriber to `canvas.zoomed` or `zoom.preZoom` exists.** Only `zoom.start/end` are consumed (`axes.ts:78-90`).
  - Existing zoom-LOD precedent: `tooltip.ts:42` (`a < TOOLTIP_ZOOM_THRESHOLD`, :11).
  - Module registry/order: `features/index.ts` (zoom :83-87, selection :78-82, outline :110-114, keyboardNav :122-126, ariaAnnouncer :129-132, drag :135-139).
- **`packages/interactive-viewer` / `editor` / `viewer`** (TS)
  - Module order: `interactive-viewer/src/index.ts:44-61` (`interactionModules`), `getModules()` :63-73 = `[...interactionModules, ...Viewer.modules, domNotificationsModule]`; Editor `editor/src/index.ts:78-92`, :182-193.
  - Boot: `viewer/src/index.ts:218-247` (caller modules after drawers :233-237); `ReboundEvent` closed set :30 (`document.changed | selection.changed | commandStack.changed`).
  - SearchPanel: `SearchPanel.ts:79-95` (listens `.created/.updated/.deleted`, not `.removed`), holds `<g>` per item :35,111, `_render()` full rebuild :154-175.
- **`packages/core/src/modelling` · `route` · `command`** (TS)
  - Reroute writer: `modelling/Links.ts:65-67` (`commandStack.changed` → `rerouteAll` :110-119), `_rerouteLink` :138-152, value-diff skip `waypointsEqual` :157-167.
  - Router: `modelling/linkRouting.ts:231-308` (`computeLinkWaypoints`), `computeSides` :149-175 (O(L) per call), obstacle list rebuilt per link :301-304, `route/obstacles.ts:89-152` (`avoidObstacles`, `MAX_ATTEMPTS=8` :21, `MARGIN=15` :19). Header of `route/types.ts` says a C10 Worker offload "is a mechanical extraction".
  - Boot-time routing: `model/model.ts` `loadModel` (~:61-76, `routeLinks` call ~:70) and `loadModelFromJson` (:116); `routeLinks` `linkRouting.ts:316-336` writes unconditionally, always O(L·(L+N log N)).
  - `CommandStack.ts`: `_enabled=false` boot latch :57; `_emitChanged` :291-299 payload `{canUndo,canRedo}` only (no ids); emitted also on `markSaved` :215-219 and `clear` :227-233.
  - `autoLayout.ts:54-64` → one `element.move` txn.
- **`packages/ssr`** (TS) — `index.ts:46-74` `renderToSvg`: module-level promise chain :33,47-49, parse ×2 (`loadModel` + `importDiagram`), `new Viewer({... idGenerator})` → `viewer.exportSVG()`; jsdom add-only globals `dom.ts:95-117`; "geometrically flat" doc :35-45. Contract tests `renderToSvg.test.ts:34-68`.
- **`apps/storybook`** (TS)
  - `playwright/_support.ts` — `loadStories` :28-43 (carries `tags` but **never filters on them**), `gotoStory` :55-84 (reducedMotion, transitions off, fonts, 250 ms settle).
  - `vr.spec.ts:10-18` and `a11y.spec.ts:35-65` iterate **every** story; **no opt-out exists**.
  - Harness pattern: `InteractionHarness.stories.ts:119-157` (window `__polytreeEditor`, `__polytreeReady`); title-lookup `interactions.spec.ts:17`.
  - `playwright.config.ts`: `retries` CI 1 :107, `workers` CI 2 :108, 1 project, `trace: on-first-retry` :125, no global timeout :102-133.
  - Fixtures: hand-written literal XML only (`src/sample.ts:87-153`); `deterministicModules()` `src/deterministic.ts:84-86`; `SequentialIdGenerator` `canvas/src/IdGenerator.ts:44-69`.
  - Workflows: `ci.yml:3-185`, `visual-regression.yml:18-130` (build steps inlined in both; no composite action).

## Patterns to REUSE

- Cross-cutting feature module listening to `<cls>.created` → reuse `Outline` shape (`features/outline.ts:25-96`; `$inject=['eventBus']`, subscribe loop :91-94, module `features/index.ts:105-108`), registered in `interactionModules` ahead of drawers.
- Zoom-driven feature → reuse `Axes` (`axes.ts`, `__depends__ [zoomModule]`, `index.ts:98-102`) and the `zoom.ts:78-102` single-writer path; viewport rect derivable from translate+scale only (PLAT-N09).
- Pure, DOM-free, numerically testable geometry → reuse `core/src/route/` layout (`route/index.ts:1-8`, `route.test.ts`) and `buildModelGraph` (`core/src/model/graph.ts:23-42`).
- Testing a `<cls>.created` listener without drawers → `bus.emit('node.created', el as unknown as DrawingSelection, def)` pattern (`outline.test.ts:38,57,70,80-85`).
- Model-position (jsdom-safe) geometry → `keyboardNav.ts` `_center` :350-362 and `zoom.ts:174-186`.
- Getting a programmatic handle to specs → harness pattern (`InteractionHarness.stories.ts:134-157`).
- Moddle-based programmatic model building → `moddle.create('pfdn:Node', …)` (`Nodes.ts:51-55`), `emptyModel()` (`model.ts:54-58`), `toXML`.
- Reroute scoping seam → `commandStack` transaction contexts already carry ids (`modelling/commands.ts:226-228,102-110,37-42,268-272`).
- Theme-/determinism-safe fixtures → `deterministicModules()` first in `modules` (SB-N04).

## Host Conventions & Hard Rules

Conventions: `CLAUDE.md` (DI, jsdom shims, dist-not-src, README/changeset), `docs/context-constitution.md` (PLAT-\*), `packages/{core,canvas,viewer,ssr}/docs/context-constitution.md`, `apps/storybook/{CLAUDE.md,docs/context-constitution.md}`, `eslint.config.js:34-52`.

**Hard rules** (verbatim; floor-equivalent, DF-6):

- "Last definition of a token wins. Composing a module _after_ the core modules overrides that token." … "Do not reorder so a core module lands last." — `CLAUDE.md` (DI invariant 1)
- "Boot order = event-subscription order." / "Any feature that must see those initial elements … therefore has to be registered **before** the drawer modules." — `CLAUDE.md` (DI invariant 2)
- "The DOM-notifications override module … must remain the **last** entry in a component's `getModules()`. Never append a module after it." — `docs/context-constitution.md:19` (PLAT-01)
- "Every DI-managed class declares `static readonly $inject = [...]`, and every service `*Module` binds `['type', Class]` **with `__init__: ['token']`**." — `docs/context-constitution.md:25` (PLAT-02)
- "Caller/subclass `modules` are appended **after** a component's own modules and win by last-definition — **except** the `d3polytree` host value" — `docs/context-constitution.md:26` (PLAT-03)
- "A re-render must **not** mutate an element's `status` — the draw layer never writes it. Only `modelling/` + `command/` may change it" — `packages/core/docs/context-constitution.md:16` (CORE-01)
- "Drawer paint z-order is set by **DOM insert-before** in `_drawContainer`, independent of DI boot order" — `packages/core/docs/context-constitution.md:22` (CORE-02)
- "`ModellingLinks` is the **single** reroute writer, triggered **only** by `commandStack.changed`. Don't add `node.updated`/incident-node reroute listeners." — `packages/core/docs/context-constitution.md:24` (CORE-04)
- "Selection-delete is decoupled from the command stack via an **intent event**" — `packages/core/docs/context-constitution.md:25` (CORE-05)
- "Reboot (`importDiagram`/`createEmpty`) routes through the **private, non-virtual `_teardown()`**, not the virtual `destroy()`" — `packages/viewer/docs/context-constitution.md:15` (VIEWER-01)
- "`viewer.on(...)` re-attaches **only** the three `ReboundEvent`s … the `*.created` boot storm fires synchronously inside `new Diagram` **before** the bus is bound and is unreachable through `on()`." — `packages/viewer/docs/context-constitution.md:16` (VIEWER-02)
- "`ElementRegistry.get()` returns a **`false` sentinel** for an unknown id — never `undefined`/`null`." — `packages/canvas/docs/context-constitution.md:15` (CANVAS-01)
- "Treat diagram transforms as **always translate + scale, never rotation/skew**" — `docs/context-constitution.md:37` (PLAT-N09)
- "Output determinism (element ids **and** serialized SVG) is a repo-wide contract … Never introduce `Math.random`, `Date`, or `Map`/`Set` iteration-order into a render or id path." — `docs/context-constitution.md:29` (PLAT-06)
- "`SequentialIdGenerator` is the deterministic-id contract `@d3-polytree/ssr` depends on … Changing its sequence … churns SSR golden files." — `packages/canvas/docs/context-constitution.md:17` (CANVAS-03)
- "jsdom shims are intentional … don't "fix" them as if they were bugs." — `CLAUDE.md` Gotchas; "The jsdom `transform.baseVal` → identity fallback in `getTransform` is intentional and load-bearing" — `packages/canvas/docs/context-constitution.md:27`
- "D3 slices are **peer** deps — import from the specific `d3-*` package, never a `d3` bundle." — `packages/core/CLAUDE.md:39`
- "`*.generated.ts` files are **committed source** … Never hand-edit" — `docs/context-constitution.md:27` (PLAT-04)
- "The Playwright runner image is byte-locked to `@playwright/test`; bump both together or the VR baselines break." — `docs/context-constitution.md:31` (PLAT-08)
- "Pixel baselines are byte-unstable across font stacks, so they are generated and compared _only_ inside `mcr.microsoft.com/playwright:v<version>-noble`" — `apps/storybook/CLAUDE.md:44-46`
- "`test:e2e` … is deliberately **not** wired into `turbo run test` … the e2e net is its own CI job." — `apps/storybook/CLAUDE.md:55-56`
- "`meta.title` is a **cross-file lookup key** for Playwright specs" — `apps/storybook/docs/context-constitution.md:17` (SB-03)
- "Component stories pass `deterministicModules()` **first**" — `apps/storybook/docs/context-constitution.md:23` (SB-N04)
- "a11y gates on regressions, not perfection … a new one fails the build." — `apps/storybook/CLAUDE.md:50-52`
- "`tsc --noEmit` typechecks the Playwright specs too" — `apps/storybook/docs/context-constitution.md:27`
- ESLint error "Route model-collection mutations through a registered commandStack handler (B10, O11)" — `eslint.config.js:~48`
- "Don't assume — ask, and surface tradeoffs. On ambiguity or a design fork, stop and raise it" / "Write the minimum that solves the stated problem. No speculative abstraction" — `CLAUDE.md:7-9`
- "A README-only edit still needs a **`patch` changeset**"; public API change ⇒ update README per `docs/README-template.md` — `CLAUDE.md` (Package READMEs)

## Dependencies

- Data / schema: none persisted by culling. Note `Zoom.setZoom` already persists scale/offset to the model per zoom event (`zoom.ts:94-98`) — a perf-relevant existing write.
- External contracts: `@d3-polytree/ssr` `renderToSvg` byte-identical output (`renderToSvg.test.ts:34-68`); `Viewer.exportSVG`/PNG serialise the live DOM (`SvgExportingUtils.ts:9-23`); closed `ReboundEvent` set (`viewer/src/index.ts:30`); typed `DiagramEventMap` (`canvas/src/events.ts:118-121`); VR baselines in `apps/storybook/playwright/__screenshots__`.
- Config / environment: no existing element-count threshold or perf config; Playwright config has no global timeout; CI `workers: 2`, `retries: 1`.
- Cross-area edges: new core feature ↔ `selection` (stores `<g>` Map `selection.ts:127`), `keyboardNav` (`_entries` Map of `g` `keyboardNav.ts:255`), `drag` (label `<g>` via `drawingRegistry` `drag.ts:203`), `alertIcons` (`alertIcons.ts:63,70`), `SearchPanel`, `outline`/`resizeElement`, `ariaAnnouncer`, `exporting`, `ModellingLinks`.

### Residency assumptions found (what a naive "remove culled `<g>`" would break)

| Feature            | Assumption                                                                                                 | Evidence                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| selection          | caches `<g>`, sets `.selected` class; never listens to `.created/.removed`                                 | `selection.ts:127,145,151-165,200-203`       |
| keyboardNav        | `_entries` Map of `g`; `.removed` nulls `_current`; focus needs DOM node; `_sizeRing` needs Outline's rect | `keyboardNav.ts:255,289-302,409-424,431-442` |
| ariaAnnouncer      | announces every post-boot `.created`/`.removed`                                                            | `ariaAnnouncer.ts:65-77`                     |
| outline            | label/zone `getBBox` needs rendered `<g>`                                                                  | `outline.ts:57-60`                           |
| drag               | label `<g>` via `drawingRegistry`; missing label silently skipped → label model position **not** updated   | `drag.ts:195-209`                            |
| export             | deep-clones live DOM → culled elements missing from SVG/PNG                                                | `SvgExportingUtils.ts:14`, `Canvas.ts:88-90` |
| SearchPanel        | holds `<g>`; `_activate` selects that `<g>`                                                                | `SearchPanel.ts:111,143-152`                 |
| alertIcons         | per-node alert element inside `.innerElement`                                                              | `alertIcons.ts:63,120-131`                   |
| mouseEvents        | 9 DOM listeners per element at `.created`                                                                  | `mouseEvents.ts:40-57`                       |
| `.removed` payload | may be bare `{id}` (ledger trap)                                                                           | `BaseElement.ts:99-101`                      |

### Existing O(N) / O(N²) costs independent of rendering (measured by reading, not profiling)

- `ModellingLinks.rerouteAll` per txn: O(L·(L+N log N)); also fires on `markSaved`/`clear`; `commandStack.changed` carries no ids (see above).
- `loadModel`/`loadModelFromJson` always run full `routeLinks`, **including ssr and static Viewer**.
- `SearchPanel._render` rebuilds the whole list per element event (O(N log N) each ⇒ ~O(N² log N) boot once the side-tab exists).
- `KeyboardNav._rovingOrder`/`_move` O(N+L) per keypress; `_ensureRing` + `Outline._updateOutline` per `.updated`.
- `Selection._unSelectAllElements` O(k²) snapshots (`selection.ts:138-149,167-171`).
- `Drag._applyOffset` emits `.moving` per element per pointer event, unthrottled (`drag.ts:267`).
- Boot = synchronous `forEach` over all items firing every `.created` listener (`BaseElement.ts:160-167`).

## Risks / Not-found

Not found (carried forward, DF-1 — never guessed):

- Any perf/benchmark/frame-time tooling, CDP/tracing/RAF sampling, perf workflow or budget file.
- Any numeric budget (ms/frame, fps), runner choice, or timing-noise tolerance for the "CI frame-time assertion" — ROADMAP says only "on a 10k-node fixture" (`ROADMAP.md:532`).
- A 10k-node fixture/generator, seeded PRNG, `.pfdn` fixture files; all fixtures are literal XML (`sample.ts:87-153`).
- Any policy for culling × keyboard nav / announcer / selection / Outline / registries; whether culled elements stay in `ElementRegistry`/`DrawingRegistry`.
- Any `<canvas>` precedent, a11y or determinism rule for a canvas overlay; ssr is SVG only.
- A viewport rect / visible-set API on `Canvas`; `viewport`/`zoom` in `ReboundEvent`.
- A story opt-out in `loadStories`/VR/a11y; only `title`-based lookup precedent.
- A window handle exposing `Zoom`/Viewer for specs (only Editor is parked on `window`); how to reach the `Zoom` instance from Editor/InteractiveViewer not verified.
- `d3-quadtree` is not a dependency of `packages/core/package.json`; no rule on adding a new D3 peer beyond "D3 slices are peer deps".
- Unread by the scouts: `viewer/src/index.ts importDiagram` body, `SearchPanel._render` cost (inferred O(N) from digest), `deploy-storybook.yml`/`release.yml`, `canvas.resized` subscribers, `tooltipModule`/`alertIconsModule` wiring, `toXML` totality harness location (`docs/context-constitution-findings.md:24`).

Design risks / unknowns:

- **Geometry in jsdom/ssr is degenerate** (`getBBox`→0, `getTransform`→identity, `getSize`→0): culling must be inert (full render) under ssr/jsdom or use model geometry + explicitly supplied viewport, else golden files churn (PLAT-06, SSR-02).
- **Label extent is not in the model** (no width/height) — a spatial index over labels needs an estimator or a conservative pad.
- **Reroute cost is the dominant non-render cost** at 10k nodes (boot + every txn). A DOM-only culling design leaves it untouched; C4 explicitly deferred it to C10 (`ROADMAP.md:526`). Whether it is in C10's scope is unspecified.
- **Culling × completeness**: export must still contain culled elements; `selection.changed`, a11y traversal and search-zoom must keep working for culled targets.
- **Timing flakiness**: a frame-time assertion on shared CI runners with `workers: 2` and `retries: 1` has no precedent rule; a flaky perf gate is worse than none.
- **VR/a11y auto-pickup**: any new story under `src/**/*.stories.ts` is screenshotted + axe-scanned and a baseline auto-committed on push (`visual-regression.yml:72-78,142-169`).
- **Stale comments** (not in scope): `autoLayout.ts:24`, `drag.ts:114`, `linkRouting.ts:18-19` still describe a `node.updated` reroute path.
- Ledger traps (`docs/design/ledger.md`): `.removed` may carry a bare `{id}` (c2); a gesture mutates more serialized props than the obvious one (command-stack); generic stack decides _when_, handler decides _how_ (c15); two-provider seam keeps the base case allocation-free (c14).
- Constitution drift: `CLAUDE.md` says CI is exactly install→lint→typecheck→test→build→build-storybook but `ci.yml` also runs format and a generated-files check.

## Recommended Scope

Advisory, for the debate:

1. A pure, DOM-free `@d3-polytree/core` spatial index + visible-set computation (model geometry, deterministic iteration), unit-testable on numeric fixtures.
2. A viewport-driven feature module in `interactionModules` (before drawers), subscribed to the zoom path, with an explicit policy for each residency assumption above and an inert/full-render mode under ssr/jsdom.
3. A measured baseline first: 10k-node fixture generator + Playwright rAF-sampling spec in a dedicated lane — the budget value is a debate/gate item, not assumed.
4. Decide explicitly (debate) whether reroute scoping (`commandStack.changed` payload ids / hoisted obstacle list / boot `routeLinks`) and the `SearchPanel._render` / selection O(N²) hotspots are in or out of C10; and whether the canvas overlay and Worker offload are in this iteration or deferred behind measurement (DN-7).
