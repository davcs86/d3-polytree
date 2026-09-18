# Implementation Plan: typed-event-bus

**Status**: `pending`
**Created**: 2026-09-18
**Design**: [design.md](./design.md)
**Test harness**: `turbo run test` (vitest/jsdom) — `package.json:19`, `.github/workflows/ci.yml:31-32`; `dependsOn: ^build` — `turbo.json:11-12`. Typecheck: `turbo run typecheck` (tsc --noEmit, `include: ["src"]` so `.test.ts` is compile-checked) — `package.json:20`, `packages/*/tsconfig.json`.
**Total Steps**: 5
**Review**: `passed-with-warnings @ 2026-09-18`

---

## Execution Summary

Build in dependency order canvas → core → interactive-viewer → editor (turbo `^build`), one package per step so every step leaves the tree buildable and typechecking. Step 1 introduces the single consolidated `DiagramEventMap` in canvas (the dep sink) and types canvas's own bus. Steps 2–4 flip each downstream package's `_eventBus` fields/params from `EventEmitter` to `EventEmitter<DiagramEventMap>` and add the interpolated-key casts, so each package typechecks against canvas's built `.d.ts`. Step 5 records the Changesets bump and runs the full CI mirror. The runtime DI token (`module.ts:20`) is never touched — the change is compile-time only.

## Step Dependencies

- Step 2 requires Step 1: core imports `DiagramEventMap`/`ElementClassName` from `@d3-polytree/canvas`'s built `dist`; rebuild canvas before core typecheck (host gotcha: cross-package tests read built `dist` — root `CLAUDE.md`).
- Step 3 requires Steps 1–2 built: interactive-viewer typechecks against canvas + core `dist`.
- Step 4 requires Steps 1–2 built: editor typechecks against canvas + core `dist`.
- Step 5 requires Steps 1–4: changeset + full CI mirror gate the whole change.
- Steps 3 and 4 are mutually independent (both depend only on 1–2).

---

### Step 1 — canvas: define `DiagramEventMap` and type the canvas bus

**Status**: `done`
**Files**:
- `packages/canvas/src/events.ts` — create
- `packages/canvas/src/index.ts` — modify
- `packages/canvas/src/Canvas.ts` — modify
- `packages/canvas/src/Canvas.test.ts` — modify

**Evidence**:
- Bus is a DI token, unchanged at runtime: `packages/canvas/src/module.ts:20` `eventBus: ['type', EventEmitter]` (do NOT touch — host rule `packages/core/CLAUDE.md:20`).
- Canvas holds the only canvas-package bus refs: `Canvas.ts:33` `private readonly _eventBus: EventEmitter;`, `:39` ctor param `eventBus: EventEmitter`, emits `canvas.init`/`canvas.destroy` `{ svg }` (`:56,63`), `canvas.resized` (`:122`), listens `d3canvas.init`/`d3canvas.destroy` (`:55,59`).
- Canvas-visible payload types already exist: `RegisteredElement` `{ id?; [key:string]: unknown }` (`types.ts:14-17`), `GroupSelection` (`types.ts:34`), `SvgSelection` (`types.ts:33`) — all re-exported from `index.ts`.
- `index.ts` currently exports the `types.ts` interfaces via a `export type { … } from './types'` block.
- `Canvas.test.ts` exercises the bus with a real `new EventEmitter()` (recon Codebase Map).

**Instructions**:
1. Create `packages/canvas/src/events.ts` exporting: `type ElementClassName = 'node' | 'link' | 'label' | 'zone'` and `type MouseKind = 'mouseenter'|'mouseover'|'mousedown'|'mouseup'|'click'|'dblclick'|'mouseleave'|'mouseout'|'contextmenu'` (mirror `mouseEvents.ts:7-17` exactly), and `interface DiagramEventMap` whose keys are the full inventory from design.md / recon.md §"Complete distinct bus event inventory", values as **argument tuples** built only from canvas-visible types (`GroupSelection` for the element slot, `RegisteredElement` for the definition slot, primitives, DOM `Event`, `Error`). Use template-literal mapped keys for the class families: `` [K in `${ElementClassName}.${'created'|'updated'|'removed'|'moving'}`]: [GroupSelection, RegisteredElement] ``; the mouse matrix `` [K in `${ElementClassName}.${Exclude<MouseKind,'click'>}`]: [GroupSelection, RegisteredElement, Event] `` plus a separate `` [K in `${ElementClassName}.${'click'}`]: [GroupSelection, RegisteredElement, { ctrlKey?: boolean } | null] ``. Literal keys: `canvas.init`/`canvas.destroy` `[{ svg: SvgSelection }]`; `canvas.resized`/`canvas.zoomed`/`d3canvas.init`/`d3canvas.destroy`/`d3canvas.clear`/`background.click`/`zoom.start`/`zoom.end`/`zoom.init` `[]`; `zoom.preZoom` `[number, number, number]`; `zoom.to.element` `[GroupSelection, RegisteredElement]`; `label.deleted`/`node.deleted`/`link.deleted` `[GroupSelection, RegisteredElement]`; `element.updated` `[string, RegisteredElement]`; `node.moved` `[GroupSelection, RegisteredElement]`; `elements.delete` `[Array<{ definition: RegisteredElement }>]`; `selection.changed` `[Array<{ element: GroupSelection; definition: RegisteredElement }>, Array<{ element: GroupSelection; definition: RegisteredElement }>]`; `outline.created`/`outline.updated` `[GroupSelection, RegisteredElement, GroupSelection]`; `commandStack.changed` `[{ canUndo: boolean; canRedo: boolean }]`; `document.changed` `[{ dirty: boolean }]`; `document.inconsistent` `[unknown]`; `sidetab.registered` `[unknown]`; `PropertiesPanel.propertyChanged` `[string, RegisteredElement]`. Add a doc comment on the mouse-matrix keys recording Open Risk #1 (the interpolated `${type}.${kind}` emit is only loosely enforced) and on the definition slot recording Open Risk #2 (rich model precision is annotation-borne, not map-borne).
2. In `packages/canvas/src/index.ts`, add `export type { DiagramEventMap, ElementClassName, MouseKind } from './events';`.
3. In `Canvas.ts`, change the import to also cover the generic (`import type EventEmitter from 'eventemitter3'` stays; add `import type { DiagramEventMap } from './events';`) and retype `_eventBus: EventEmitter<DiagramEventMap>` (`:33`) and the ctor param `eventBus: EventEmitter<DiagramEventMap>` (`:39`). Do not change `module.ts`.
4. Keep command strings OUT of the map (`element.create`/`element.delete`/`element.resize`/`element.move` route through `commandStack.execute`, `modelling/commands.ts:260-273`).

**Verification**: `pnpm --filter @d3-polytree/canvas build && pnpm --filter @d3-polytree/canvas typecheck && pnpm --filter @d3-polytree/canvas test` all green; `pnpm --filter @d3-polytree/canvas exec eslint src`. Confirm `git diff packages/canvas/src/module.ts` is empty (token unchanged).

**Test**: Extend `packages/canvas/src/Canvas.test.ts` — add a compile-time assertion block: on a `new EventEmitter<DiagramEventMap>()`, a correct `bus.emit('canvas.init', { svg })` compiles, and a wrong one is rejected under `// @ts-expect-error` (e.g. `bus.emit('canvas.init', 123)` and `bus.emit('not.an.event')`). Verified by `pnpm --filter @d3-polytree/canvas typecheck` (the `@ts-expect-error` errors "unused" against today's untyped bus → fails before; passes after). Existing runtime assertions stay green under `vitest`.

---

### Step 2 — core: type every bus site + interpolated-key casts

**Status**: `done`
**Files**:
- `packages/core/src/draw/BaseElement.ts` — modify (retype `_className` + bus)
- `packages/core/src/draw/{Nodes,Links,Labels,Zones}.ts` — modify (ctor param type)
- `packages/core/src/Diagram.ts` — modify (`get<EventEmitter<DiagramEventMap>>`)
- `packages/core/src/features/{selection,mouseEvents,drag,zoom,axes,outline,resizeElement,backgroundColor,tooltip}.ts` — modify
- `packages/core/src/features/palette/{PaletteProvider,AddLinkTool}.ts` — modify
- `packages/core/src/command/CommandStack.ts` — modify
- `packages/core/src/modelling/{Modelling,ModellingElement,Nodes,Links,Labels,Zones}.ts` — modify
- `packages/core/src/draw/drawerTestUtils.ts` — modify if it declares a typed bus
- one core test file (see Test) — modify

**Evidence** (all confirmed via `grep -n "EventEmitter" packages/core/src`):
- `_eventBus: EventEmitter` field/param sites: `draw/BaseElement.ts:17,29`; `draw/{Zones:22,Nodes:26,Labels:26,Links:30}.ts`; `modelling/Modelling.ts:39,44`, `modelling/{Zones:27,Nodes:38,Labels:30,Links:70}.ts`, `modelling/ModellingElement.ts:26,33`; `features/palette/PaletteProvider.ts:65`, `features/palette/AddLinkTool.ts:27,33`; `features/backgroundColor.ts:23,26`; `features/resizeElement.ts:33,37`; `features/outline.ts:27,29`; `features/axes.ts:35,47`; `features/zoom.ts:43,52`; `features/selection.ts:23,26`; `features/mouseEvents.ts:31,33`; `features/drag.ts:30,39`; `features/tooltip.ts:23`; `command/CommandStack.ts:37,46`.
- `get<EventEmitter>` sites: `Diagram.ts:65,74,78`.
- `ElementClass` union already exists: `packages/core/src/modelling/Modelling.ts:9` `export type ElementClass = 'label' | 'node' | 'zone' | 'link';`.
- Interpolated emits to fix: `BaseElement.ts:92,119,131` (`${this._className}.removed/created/updated`), `mouseEvents.ts:46` (`${type}.${kind}`), `drag.ts:139` (`${getLocalName(def)}.moving`).
- `_className` currently `string`: `BaseElement.ts:15` (field), `:26` (ctor param); the four drawer subclasses pass literals via `super('node'|'link'|'label'|'zone', …)` (`draw/{Nodes,Links,Labels,Zones}.ts`).
- Cast idiom precedent for the `getLocalName(): string → ElementClass` narrowing: `Modelling.ts:98,115` (`… as ElementClass`).

**Instructions**:
1. Import the map/union into each file that types the bus: `import type { DiagramEventMap } from '@d3-polytree/canvas';` (the `RegisteredElement`-based path already works cross-package — `draw/types.ts:2` imports from `@d3-polytree/canvas` today). Replace every `EventEmitter` annotation listed in Evidence with `EventEmitter<DiagramEventMap>` (fields, ctor params, and the three `Diagram.ts` `get<EventEmitter>` → `get<EventEmitter<DiagramEventMap>>`).
2. Narrow the interpolated keys so they resolve to literal unions:
   - `BaseElement.ts`: change `_className: string` (`:15`) and the ctor `className` param (`:26`) to `ElementClass` (import from `../modelling` per `index.ts` re-export). The four `super(...)` literal call sites already satisfy it — no drawer call-site change.
   - `mouseEvents.ts:43,46`: annotate the computed `type` as `ElementClass` (cast the `getLocalName(...)` branch: `className ?? (getLocalName(definition) as ElementClass)`), mirroring `Modelling.ts:98,115`.
   - `drag.ts:139`: cast `getLocalName(def) as ElementClass` in the `${…}.moving` emit.
3. Do NOT reorder any module registration (host rule `CLAUDE.md:71,76`). Do NOT add a constructor argument anywhere (didi ledger trap 2026-09-18 — the generic is erased, no `$inject` change).
4. If `drawerTestUtils.ts` constructs/declares a typed bus, apply the same annotation so core tests compile.

**Verification**: `pnpm --filter @d3-polytree/canvas build` first (upstream), then `pnpm --filter @d3-polytree/core build && pnpm --filter @d3-polytree/core typecheck && pnpm --filter @d3-polytree/core test` green; `pnpm --filter @d3-polytree/core exec eslint src`. A red typecheck naming an unenumerated event key means the map (Step 1) is missing that key — add it to `events.ts` and note it in the Deviation Log, do not loosen the core annotation.

**Test**: Add a `// @ts-expect-error` compile-time assertion to an existing core bus test (e.g. `packages/core/src/command/CommandStack.test.ts`, which already asserts `commandStack.changed`/`document.inconsistent`): a correct `emit('document.changed', { dirty: true })` compiles and `emit('document.changed', { dirty: 'nope' })` is rejected under `@ts-expect-error`. Verified by `pnpm --filter @d3-polytree/core typecheck`. Existing runtime tests stay green.

---

### Step 3 — interactive-viewer: type search-panel + side-tabs bus sites

**Status**: `done`
**Files**:
- `packages/interactive-viewer/src/search-panel/SearchPanel.ts` — modify
- `packages/interactive-viewer/src/side-tabs/SideTabs.ts` — modify
- `packages/interactive-viewer/src/side-tabs/SideTabsProvider.ts` — modify
- one interactive-viewer test file (see Test) — modify

**Evidence**:
- `_eventBus: EventEmitter` sites: `search-panel/SearchPanel.ts:49,54`; `side-tabs/SideTabs.ts:23,30`; `side-tabs/SideTabsProvider.ts:24,27`.
- Interpolated emit: `SearchPanel.ts:137-138` `const clickEvent = \`${localName}.click\`` then `emit(clickEvent, item.element, item.definition, null)`; also emits `zoom.to.element` (`:136`), subscribes `node.created`/`link.created`/`node.deleted`/`link.deleted` (`:75-84`). `SideTabsProvider.ts:37` emits `sidetab.registered`; `SideTabs.ts:152` subscribes it.
- `eventemitter3` is a direct dep here (`packages/interactive-viewer/package.json:33`).

**Instructions**:
1. Retype the `_eventBus` field/param at all six sites to `EventEmitter<DiagramEventMap>` (`import type { DiagramEventMap } from '@d3-polytree/canvas';`).
2. `SearchPanel.ts:137`: the existing expression is `const clickEvent = \`${item.definition.$descriptor.ns.localName.toLowerCase()}.click\``. Do NOT rewrite the interpolation — **append** an `as \`${ElementClassName}.click\`` cast to that existing expression so the key resolves to a literal-union member (import `ElementClassName` from `@d3-polytree/canvas`), preserving the `$descriptor.ns.localName.toLowerCase()` access and the `null` 3rd arg at `:138` (the `.click` payload is `{ ctrlKey?: boolean } | null`). The `sidetab.registered` and `zoom.to.element`/`*.created`/`*.deleted` sites are literal keys — no cast, just the field retype.

**Verification**: `pnpm --filter @d3-polytree/canvas build && pnpm --filter @d3-polytree/core build` first, then `pnpm --filter @d3-polytree/interactive-viewer build && … typecheck && … test` green; `pnpm --filter @d3-polytree/interactive-viewer exec eslint src`.

**Test**: Add a `// @ts-expect-error` assertion to an existing interactive-viewer bus test (e.g. `search-panel/index.test.ts`, which emits `node.created`/asserts `zoom.to.element`): correct `emit('sidetab.registered', x)` compiles, a bogus `emit('sidetab.registerd', x)` (typo) is rejected under `@ts-expect-error`. Verified by `pnpm --filter @d3-polytree/interactive-viewer typecheck`.

---

### Step 4 — editor: type properties-panel bus sites

**Status**: `done`
**Files**:
- `packages/editor/src/properties-panel/PropertiesPanel.ts` — modify
- `packages/editor/src/properties-panel/EntryFactory.ts` — modify
- `packages/editor/src/properties-panel/PfdnPropertiesProvider.ts` — modify
- one editor test file (see Test) — modify

**Evidence**:
- `_eventBus: EventEmitter` sites: `PropertiesPanel.ts:63,75`; `EntryFactory.ts:46,48`; `PfdnPropertiesProvider.ts:134,136`.
- Emits `PropertiesPanel.propertyChanged` (`EntryFactory.ts:71`), `element.updated`/`canvas.resized` (`PfdnPropertiesProvider.ts:144,147,151`); subscribes `selection.changed` (`PropertiesPanel.ts:118`), `PropertiesPanel.propertyChanged` (`PropertiesPanel.ts:177`).
- `command.roundtrip.test.ts:65` is the only place a bus payload is hand-typed today (`{ dirty: boolean }`) — a typed `get<EventEmitter<DiagramEventMap>>` can replace that inline shape (optional cleanup).
- `eventemitter3` is a direct dep here (`packages/editor/package.json:33`).

**Instructions**:
1. Retype the `_eventBus` field/param at all six sites to `EventEmitter<DiagramEventMap>`. All editor event keys (`PropertiesPanel.propertyChanged`, `element.updated`, `canvas.resized`, `selection.changed`) are literal — no casts needed.
2. Optional: replace the inline `{ on(e, cb: (p:{dirty:boolean})=>void) }` cast at `command.roundtrip.test.ts:65` with `get<EventEmitter<DiagramEventMap>>('eventBus')` now that the payload is typed (only if it keeps the test green).

**Verification**: `pnpm --filter @d3-polytree/canvas build && pnpm --filter @d3-polytree/core build` first, then `pnpm --filter @d3-polytree/editor build && … typecheck && … test` green; `pnpm --filter @d3-polytree/editor exec eslint src`.

**Test**: Add a `// @ts-expect-error` assertion to an existing editor bus test (e.g. `properties-panel/index.test.ts`, which asserts `element.updated`/`selection.changed`): correct `emit('selection.changed', [], [])` compiles, a wrong-arity `emit('selection.changed')` is rejected under `@ts-expect-error`. Verified by `pnpm --filter @d3-polytree/editor typecheck`.

---

### Step 5 — Changesets minor + full CI mirror

**Status**: `pending`
**Files**:
- `.changeset/<slug>.md` — create

**Evidence**:
- Changesets config: `.changeset/config.json` (`baseBranch: main`, `updateInternalDependencies: patch`, access public).
- Packages touched are at `0.1.0` and publishable (`private:false`); O12 precedent ships pre-1.0 typed changes as a minor (recon.md:55).
- CI order (mirror before pushing): install (frozen) → lint → typecheck → test → build → build-storybook — `.github/workflows/ci.yml:22-39`, `CLAUDE.md:34`.

**Instructions**:
1. Create `.changeset/<slug>.md` marking `@d3-polytree/canvas`, `@d3-polytree/core`, `@d3-polytree/interactive-viewer`, `@d3-polytree/editor` as **minor**, describing the typed `DiagramEventMap` event surface (additive at runtime; `on`/`emit` now payload-checked; `viewer` untouched). Do NOT include `@d3-polytree/viewer` (no source change) or `@d3-polytree/ssr`.
2. Run the full CI mirror from the repo root and confirm green.

**Verification**: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook` all green (mirrors `.github/workflows/ci.yml`).

**Test**: N/A (config-only; the per-package type-tests in Steps 1–4 and the full `pnpm typecheck` are the behavioral gate).

---

## Review Log

**2026-09-18 — verdict: passed-with-warnings** (design-buddy plan-review, full criteria A–D). No blockers: every cited `path:line` resolves; Step 2's ~30-site `EventEmitter` inventory is complete (no missed field that would break mid-step typecheck); the single-instance rule (`module.ts:20` untouched), boot-order rule, and cross-package-dist rule are all honored; no rejected alternative reintroduced (no `declare module` augmentation, no `DiagramEventModel` shadow — plan reuses `RegisteredElement`). Reviewer also resolved (not left open) that untyped `new EventEmitter()` in test files / `drawerTestUtils.ts:20` stays assignable to `EventEmitter<DiagramEventMap>` ctor params (eventemitter3's untyped methods use `any[]`), so no omitted test-file retype breaks typecheck.

Two warnings, disposed at the user gate:
- **W1 — FIXED (pre-execution amendment).** Step 3 instruction 2 paraphrased `SearchPanel.ts:137` as `\`${localName}.click\``; the real expression is `\`${item.definition.$descriptor.ns.localName.toLowerCase()}.click\``. Amended the instruction to **append** the `as \`${ElementClassName}.click\`` cast to the existing expression (not rewrite the interpolation), preserving the `$descriptor…toLowerCase()` access.
- **W2 — WAIVED.** Element-slot Datum widening (`DrawingSelection = Selection<…, DiagramElement>` → the map's `GroupSelection = Selection<…, unknown>`) is not compile-proven in the plan text. Waived: `GroupSelection` is the design's decided slot type (canvas cannot import core's `DiagramElement`), assignability rests on d3-selection method bivariance (standard), and each step's `pnpm typecheck` is the real gate — a genuine incompatibility fails the step rather than shipping.

## Deviation Log

- **Step 1 — test-bus retype is required after all (corrects the review's "no test retype needed").** `new EventEmitter()` (untyped `EventEmitter<string|symbol>`) is NOT assignable to an `EventEmitter<DiagramEventMap>` constructor parameter — `tsc` rejects it because `eventNames()` returns the wider `(string|symbol)[]` (TS2345). The reviewer's "Could not evaluate → resolved" note (untyped methods use `any[]`) held only for the emit/on *arg* positions, not for whole-emitter assignability. Fix applied: any test/helper that constructs a bus and passes it to a now-typed constructor uses `new EventEmitter<DiagramEventMap>()`. Applied to `packages/canvas/src/Canvas.test.ts` `makeCanvas`; the same fix is applied per-package in Steps 2–4 wherever a test constructs a bus for a typed ctor (extends each step's Files with its `*.test.ts` / `drawerTestUtils.ts`).
- **Step 1 — `DiagramEventMap` authored as a `type` alias (intersection of template-literal mapped types + a `LiteralEvents` interface), not a single `interface`.** An `interface` cannot express the `${ElementClassName}.${…}` mapped keys. Verified the `type` alias survives the tsup/rollup-dts bundle intact (`packages/canvas/dist/index.d.ts` emits the full map, no `declare module`), so the Option-B dts-robustness property the design relied on is preserved.

- **Step 2 — the opaque payload slots are `any`, not `GroupSelection`/`RegisteredElement` (the design's W2 risk, materialized).** The design/plan typed the element slot `GroupSelection` and the model slot `RegisteredElement`. Both fail under the real type system, in *both* directions, which only `tsc` exposed:
  - **Emit side / invariance:** d3's `Selection` is invariant on its datum, so the drawers' `DrawingSelection = Selection<SVGGElement, DiagramElement>` is NOT assignable to `GroupSelection = Selection<SVGGElement, unknown>` (TS2345 at `BaseElement.ts:94,121,133`). W2 (waived) predicted exactly this; the typecheck gate caught it.
  - **Subscribe side / contravariance:** under `strictFunctionTypes`, eventemitter3's `on(event, fn)` checks `fn`'s parameters contravariantly, so a subscriber annotating the real narrower type (`(el: DrawingSelection, def: ModellingModelElement) => …` at `outline.ts:94`, `Modelling.ts:97`, `drag.ts:160`, `tooltip.ts:37`, etc.) rejects any canvas-nameable supertype (`unknown`, `RegisteredElement`). The reviewer's "bivariant `on`-listener" premise was empirically false.
  Since canvas cannot import the core types these slots hold, the only type that satisfies both emit and annotated-subscribe is **`any`** for the drawn-selection and model slots (and the `.click` 3rd arg, which varies `Event`/`{ctrlKey?}`/`null` across subscribers). Canvas-expressible payloads stay precise (`{svg}`, `{dirty}`, `{canUndo,canRedo}`, string ids, `zoom.preZoom` numbers, event names + arity). This is a faithful realization of the design's *stated* honest guarantee (Chosen Approach + Open Risk #2: "emit-site key + arity + primitive-payload checking; rich model access is annotation-borne") — the architecture (single consolidated canvas map, compile-time only, no augmentation) is unchanged. `events.ts` carries a scoped `eslint-disable @typescript-eslint/no-explicit-any` with this rationale.
- **Step 2 — extra minimal fixes the typecheck forced (all type-only / test-only, no runtime change):** `zoom.preZoom` slot typed `[number?, number?, number?]` (its emit at `zoom.ts:74` passes `setZoom`'s optional params; no subscriber exists, so no precision lost); `BaseElement.test.ts` synthetic drawer switched from the non-`ElementClass` name `'test'` to `'node'`; `alerts-tooltip.test.ts:105` `emit('node.mouseout')` given its real 3-arg payload (the map correctly rejected the 0-arg emit); every core `*.test.ts` bus construction/annotation retyped to `EventEmitter<DiagramEventMap>` (the same test-bus assignability deviation logged for Step 1, applied across core).

- **Step 4 — editor imports `DiagramEventMap` from `@d3-polytree/core`, not `@d3-polytree/canvas`.** The plan/design said "import from `@d3-polytree/canvas`", but editor's `package.json` has no direct `canvas` dependency (only `viewer`/`core`/`interactive-viewer`), so `tsc` could not resolve the module (TS2307). Rather than add a new dependency + lockfile edit, re-exported the event types from **core**'s `index.ts` (`export type { DiagramEventMap, ElementClassName, MouseKind } from '@d3-polytree/canvas';`) — core already imports canvas and is a direct editor dep — and pointed editor's imports at `@d3-polytree/core`. Good API hygiene (core surfaces the bus contract to its consumers); zero dependency-graph change. (interactive-viewer kept its `@d3-polytree/canvas` import in Step 3 — it *does* declare canvas directly.)
- **Step 4 — minimal type-only fixes:** `PfdnPropertiesProvider` emits `element.updated` with `definition.id!` / `label.id!` (moddle ids are optional in the type but always present for an element being updated; the subscriber requires `string`, so the slot cannot loosen without breaking listener contravariance — a non-null assertion is the truthful, runtime-neutral fix); the `properties-panel/index.test.ts` `selection.changed` emits given the required `element` entry field; and the plan's optional cleanup done — `command.roundtrip.test.ts:65`'s hand-typed `{ on(...) }` bus replaced with `get<EventEmitter<DiagramEventMap>>('eventBus')`.

_Step bodies above are immutable (DN-5); divergence recorded here with the step number, what changed, and why._
