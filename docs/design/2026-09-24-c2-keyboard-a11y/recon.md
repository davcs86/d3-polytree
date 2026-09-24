# Recon: c2-keyboard-a11y

**Created**: 2026-09-24
**Change**: Keyboard-first accessibility (WCAG 2.2 AA) for the diagram: `role="application"` + roving `tabindex` over a topological order, arrow-key spatial navigation by direction cone, an `aria-live` region announcing selection/mutation, per-element `<title>`/`<desc>`, in-SVG focus rings, an Escape hatch, and a `prefers-reduced-motion` guard (roadmap C2, `ROADMAP.md:524`).
**Depth**: full
**Affected areas**: `packages/canvas/src`, `packages/core/src` (draw + features + command), `packages/interactive-viewer/src`, `apps/storybook` (a11y stories)

---

## Repo Profile

pnpm + Turbo monorepo; the engine is a **didi** module graph; components subclass (`Editor extends InteractiveViewer extends Viewer`). The C8 quality net runs Storybook through Playwright + `@axe-core/playwright` in `.github/workflows/visual-regression.yml` (a11y gate). Tooling: vitest (jsdom), tsc, eslint, prettier; CI order per `ci.yml`.

## Codebase Map

- **`packages/canvas/src`** (SVG surface, TS)
  - Root `<svg>` created `Canvas.ts:55-59` (`.attr('pointer-events','all')`); container `<div class="pfdjs-container">` `:17-29`; `getSVG()` `:83-85`, `getContainer()` `:78-80`. **No** role/tabindex/aria/focus today. Lifecycle events `canvas.init` `:63`, `canvas.resized` `:129`, `canvas.destroy` `:70`.
  - Typed bus: `packages/canvas/src/events.ts` — `selection.changed [prev,next]` `:95`; `<class>.created|updated|removed|moving` `:57-62`; `node.moved` `:93`; `commandStack.changed` `:103`; `document.changed` `:104`; `<class>.click` `:75-77`; `background.click` `:88`. New a11y events go in `LiteralEvents`.
- **`packages/core/src`** (TS)
  - Per-element `<g>`: `BaseElement.appendElement` `:104-119` — `.append('g').attr('element-id', id).attr('class', '<cls>Item element')`, inner `.innerElement`, emits `<class>.created`. **Home for `<title>`/`<desc>` + in-SVG focus ring.** Node geometry `Nodes.ts:39-55` (`translate(x,y)`, `x`/`y` attrs).
  - Feature-module pattern: `features/selection.ts` (`$inject=['eventBus']` `:22`; `_init` subscribes `<class>.click`/`background.click` `:96-101`; state `Map<id,SelectionEntry>` `:25`; toggles `selected` class `:58`; emits `selection.changed` `:61`; API `select`/`getSelectedElements`/`deleteSelected` `:70-94`). `features/mouseEvents.ts` `_init` `:53-57`. Module objects e.g. `autoLayoutModule` `autoLayout.ts:146-150`, `domNotificationsModule` `DomNotifications.ts:168-170`; re-exported via `features/index.ts` → `core/src/index.ts:31`.
  - Command stream: `CommandStack._emitChanged` `:201-208` emits `commandStack.changed`/`document.changed`; boot-latched by `d3canvas.init` `:51,84`.
  - Topo order source (internal, **unexported**): `packages/layout/src/internal.ts:98-128` (`assignRanks`, Kahn topo), `:200-234` (layers/order). `LayoutResult` (`layout/src/types.ts:48-52`) exposes positions only. Model-graph derivation template: `features/autoLayout.ts:84-102` (`_buildGraph` from `d3polytree.definitions.node`/`.link`), `_liveNodes` `:66-69`.
  - Coordinates: `NodeDefinition.position: Point` `draw/definitions.ts:40-44`; live `<g>` via `DrawingRegistry.get(id)` `DrawingRegistry.ts:15-17`.
  - Transition to guard: `features/zoom.ts:3` (`import 'd3-transition'`), `setInitialZoom` `:108-118` (instant branch already exists at `:116`), `ZOOM_TO_DURATION=1800` `:18,181-186`.
- **`packages/interactive-viewer/src`** — module lists: `interactionModules` `index.ts:36-48` (backgroundColor, zoom, …, selection, outline, sideTabs, searchPanel); `getModules()` `:50-60` returns `[...interactionModules, ...Viewer.modules, domNotificationsModule]`. `Viewer.modules` (drawers) `viewer/src/index.ts:61-66`.
  - Escape/aria precedent: `notifications/DomNotifications.ts` — `role="alert"`/`"status"` `:72`, `role="alertdialog"`+`aria-modal` `:105-106`, Escape/focus mgmt `:144-159`. Builds DOM in the container `:26-29`.
- **`apps/storybook`** — a11y gate `playwright/a11y.spec.ts` (`AxeBuilder.include('#storybook-root')` `:24`; gates serious/critical vs `a11y-baseline.json`, `_a11y.ts:6,16-38`); baseline empty today. Reduced-motion emulated in harness `_support.ts:62-68`. Stories under `src/**/*.stories.@(ts|js)` auto-picked; `Tests/Interaction Harness` parks a live `Editor` on `window`.

## Patterns to REUSE

- Feature-module scaffold → mirror `features/selection.ts` (`$inject`, `_init`, `*Module` export via `features/index.ts`).
- Announce sources → subscribe to existing `selection.changed` (`selection.ts:61`) + `commandStack.changed` (`CommandStack.ts:203`) + lifecycle `<class>.created|updated|removed` — **do not** invent an `elements.changed` (none exists).
- aria-live/Escape → mirror `DomNotifications` container-build + role/Escape pattern (`DomNotifications.ts:26-29,72,144-159`) for the polite live region.
- Coordinates for cone math → `def.position` (`definitions.ts:40-44`) + `DrawingRegistry.get(id)`.
- Reduced-motion → reuse the existing instant branch in `zoom.ts:116` (pass `duration=0` when `matchMedia('(prefers-reduced-motion: reduce)').matches`).
- Topo order → derive from the model graph like `autoLayout._buildGraph` (`autoLayout.ts:84-102`) OR export layout's internal `assignRanks` — fork.

## Host Conventions & Hard Rules

- **Hard rule** (root `CLAUDE.md`, "Boot order = event-subscription order"): "**Moving a created-listener after the drawers silently drops the initial elements — a real bug the folded-panel tests guard against.**" → the a11y module (attaching title/desc/focus, building roving order) MUST be registered in `interactionModules` **ahead of** the drawers.
- **Hard rule** (root `CLAUDE.md`, "Last definition of a token wins"): `domNotificationsModule` must stay last on its token; don't reorder it.
- **Hard rule** (root `CLAUDE.md` `PLAT-04`): don't hand-edit generated files (`element/src/styles.generated.ts`); style additions go to SCSS/source, not generated CSS.
- **Hard rule** (`d3-polytree/CLAUDE.md` #4 / `PLAT-08`): CI order install→lint→typecheck→test→build→build-storybook; the a11y axe gate must stay green (any new serious/critical violation fails CI unless baselined).
- **Hard rule** (`d3-polytree/CLAUDE.md` "How to Act" #1): surface design forks at a gate (topo-order reuse; announcer placement).
- Convention: jsdom shims are intentional (getBBox/transform.baseVal) — a11y code must tolerate jsdom (tests run there).

## Dependencies

- Data / schema: none (a11y is a view/interaction concern; reads model `position`/graph, writes DOM attrs only).
- External contracts: new `@d3-polytree/core` feature module export (`keyboardNavModule`/`accessibilityModule`); possibly a new `@d3-polytree/layout` export if reusing the internal topo sort; new bus events if an announce channel is added.
- Config / environment: none; a11y stories added under `apps/storybook/src`.
- Cross-area edges: core feature → canvas SVG root + drawer `<g>`s; interactive-viewer module list; storybook stories drive the axe gate.

## Risks / Not-found

- **Fork 1 — topo order**: export layout's internal `assignRanks`/`buildInternal` (`internal.ts:98-128`) vs. re-derive a Kahn sort in the feature from the model graph (`autoLayout.ts:84-102`).
- **Fork 2 — announcer placement**: in-engine feature module subscribing to `eventBus` (matches `selection.ts`) vs. component layer via `Viewer.on()` rebound events (`viewer/src/index.ts:93-100`).
- **Ledger trap `2026-09-18 deterministic-ids-ssr` (didi `$inject`)**: any new service with constructor args must declare `static $inject`.
- **jsdom limits**: `getBBox` returns zero box in jsdom (Outline already guards) — focus-ring geometry must not depend on real `getBBox` under tests.
- axe baseline is empty → a new `role="application"` without an accessible name, or invalid ARIA, fails CI. Must supply an accessible name and valid roles.
- Not found: any existing roving tabindex / in-SVG focus ring / per-element title/desc / runtime reduced-motion guard — all greenfield.

## Recommended Scope

A new core feature module (registered ahead of drawers) that: sets `role="application"` + accessible name + `tabindex="0"` on the stable `<svg>`; maintains a roving `tabindex` across element `<g>`s in a topological order; implements arrow-key direction-cone navigation using `position`; appends `<title>`/`<desc>` and an in-SVG focus ring per element on `<class>.created`; builds a container-level `aria-live="polite"` region fed by `selection.changed` + `commandStack.changed`; provides an Escape hatch out of `role="application"`; and guards `zoom.ts` transitions with `prefers-reduced-motion`. Add axe-clean Storybook stories. Decide forks 1 & 2 at the gate.
