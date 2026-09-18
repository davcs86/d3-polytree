# Recon: typed-event-bus

**Created**: 2026-09-18
**Change**: Replace the stringly-typed `eventemitter3` event surface with a declaration-merged event map so `on`/`emit` are checked against payload types (ROADMAP C12, size S).
**Depth**: full
**Affected areas**: `packages/canvas`, `packages/core`, `packages/interactive-viewer`, `packages/editor` (and, as a type-only consumer, `packages/viewer`)

---

## Repo Profile

pnpm + Turborepo monorepo (TypeScript/ESM) publishing `@d3-polytree/*` v2 packages; layered subclass composition (`Editor extends InteractiveViewer extends Viewer`) wired by the `didi` DI container. The event surface is a **single shared `eventemitter3` instance** provided by `canvasModule` and injected into every feature — the exact stringly-typed surface C12 targets. CI runs exactly `install (frozen) → lint → typecheck → test → build → build-storybook` — `.github/workflows/ci.yml:22-39`; `pnpm lint`=`eslint .` (`package.json:21`), `pnpm typecheck`=`turbo run typecheck` (tsc --noEmit, `dependsOn: ^build` — `turbo.json:8-9`), `pnpm test`=`turbo run test` (vitest/jsdom). Node 20, pnpm pinned `10.34.5`.

## Codebase Map

- **`packages/canvas`** (TS) — owns the bus token.
  - DI token (the retype target): `eventBus: ['type', EventEmitter]` — `packages/canvas/src/module.ts:20`
  - Injection pattern: `private readonly _eventBus: EventEmitter` via `$inject=['config','eventBus']` — `packages/canvas/src/Canvas.ts:31,33,39-40`
  - Emits `canvas.init {svg}`, `canvas.destroy {svg}`, `canvas.resized` (no payload) — `Canvas.ts:56,63,122`
  - `types.ts` already defines `SvgSelection` (payload type for `canvas.*`) — `packages/canvas/src/types.ts:33`
  - Tests: `packages/canvas/src/Canvas.test.ts:2,26-30,51` (asserts `canvas.init` `.svg`, fires `d3canvas.init/destroy`)
- **`packages/core`** (TS) — richest emit/subscribe surface; drawers + features.
  - `Diagram` emits boot latches via `get<EventEmitter>('eventBus')` — `packages/core/src/Diagram.ts:65,74,78`
  - Draw notifications (interpolated names): `BaseElement.ts:92,119,131` (`${className}.removed/created/updated`)
  - Mouse matrix (interpolated): `features/mouseEvents.ts:46` (`${type}.${kind}`)
  - CommandStack: `command/CommandStack.ts:196,202,206` (`document.inconsistent`, `commandStack.changed`, `document.changed`)
  - Tests: `modelling/orchestrator.test.ts`, `features/{outline,features,zoom,axes,backgroundColor}.test.ts`, `command/CommandStack.test.ts`
- **`packages/interactive-viewer`** (TS) — search-panel + side-tabs.
  - Subscribes `node.created`/`link.created`/`node.deleted`/`link.deleted`, emits `zoom.to.element` + `${localName}.click` — `search-panel/SearchPanel.ts:75-84,136-138`
  - `sidetab.registered` emit/subscribe — `side-tabs/SideTabsProvider.ts:37`, `SideTabs.ts:152`
- **`packages/editor`** (TS) — properties-panel.
  - Subscribes `selection.changed`, `PropertiesPanel.propertyChanged` — `properties-panel/PropertiesPanel.ts:118,177`
  - Emits `PropertiesPanel.propertyChanged`, `element.updated`, `canvas.resized` — `EntryFactory.ts:71`, `PfdnPropertiesProvider.ts:144,147,151`
  - The **only hand-typed payload today**: `command.roundtrip.test.ts:65` inline-types `{ dirty: boolean }`
- **`packages/viewer`** (TS) — exposes bus only via generic `get<T>(name)` — `packages/viewer/src/index.ts:98`. **No direct `eventemitter3` dep** (transitive via core).

## Patterns to REUSE

- Typed emitter mechanism → **`eventemitter3`'s own generic `EventEmitter<EventTypes>`** (v5, already the pinned dep `^5.0.1` in canvas/core/interactive-viewer/editor — `packages/canvas/package.json:28` et al.). EventTypes maps each event name → an **argument tuple**, which natively covers the multi-positional-arg emits (`emit('selection.changed', prev, next)`). No new emitter abstraction needed (**DN-2/DN-7**).
- Base event-map home → **the `eventBus` token's own package, `packages/canvas`** — it is the dependency sink every other package already imports (`canvas ← core ← viewer ← interactive-viewer ← editor`). A base `interface` there, augmented downstream by TypeScript **declaration merging**, mirrors how icon packs already compose via "last definition wins".
- Payload types → reuse existing model/selection/selection types already exported (`SvgSelection` — `canvas/src/types.ts:33`; `ModellingModelElement`, `SelectionEntry`, `ElementDefinition` referenced at the subscribe sites) rather than minting new shapes.
- Injection typing seam → the existing `$inject`/`get<EventEmitter>` sites (`Canvas.ts:33`, `Diagram.ts:65`) are the exact points to change `EventEmitter` → `EventEmitter<DiagramEventMap>`.

## Host Conventions & Hard Rules

- **Hard rule**: "The eventBus is a single `eventemitter3` instance provided by `canvasModule`; every feature injects the same one." — `packages/core/CLAUDE.md:20` (the typed change must remain **one shared instance**, compile-time only, zero runtime change).
- **Hard rule**: "**Boot order = event-subscription order.** Drawers emit `<class>.created` (`node.created`, `link.created`, …) *during* boot as they render the loaded model." — `CLAUDE.md:71`; and "Moving a created-listener after the drawers silently drops the initial elements — a real bug the folded-panel tests guard against." — `CLAUDE.md:76`. (Retyping must not reorder module registration.)
- **Hard rule**: "`Canvas` … emits `canvas.init` / `canvas.resized` / `canvas.destroy` on the **injected eventBus**." — `packages/canvas/CLAUDE.md:8`
- **Hard rule**: "D3 slices are **peer** deps — import from the specific `d3-*` package, never a `d3` bundle." — `packages/core/CLAUDE.md:22`
- Convention: CI is fixed & mirrored before pushing — `CLAUDE.md:34`. No absolute rule forbids re-typing the emitter surface itself.

## Dependencies

- Data / schema: none (compile-time typing only; the runtime `.pfdn` model is untouched).
- External contracts: the **public event surface** consumers observe via `Viewer.get('eventBus')` — today an untyped `EventEmitter`. Typing it is additive at runtime but changes the exported *type* (packages at `0.1.0`; a Changesets minor with a note, per the O12 precedent for pre-1.0 typed changes).
- Config / environment: none.
- Cross-area edges: declaration merging must target the same exported interface across `canvas → core → interactive-viewer → editor`; `viewer` currently has **no direct `eventemitter3` dep** (`packages/viewer/package.json` — a decision point: add it, or keep viewer type-only).

## Risks / Not-found

- **Interpolated (template-literal) event names** are the central typing challenge — the emit sites don't hold a literal key:
  - `${className}.created|updated|removed` where `_className ∈ {node,link,label,zone}` — `BaseElement.ts:92,119,131` (`className` set in `draw/{Nodes,Links,Labels,Zones}.ts`)
  - `${type}.${kind}` — a **36-combo** matrix (4 types × 9 kinds) — `mouseEvents.ts:46` (kinds enumerated `:7-17`)
  - `${localName}.click` — `SearchPanel.ts:137`; `${getLocalName(def)}.moving` — `drag.ts:139`; `${cls}.click` subscribe — `selection.ts:97`
  Whether these emit/subscribe sites type-check against a template-literal-keyed map (and whether `_className` etc. are typed as the literal union vs `string`) is an **open risk the debate must resolve**.
- **No existing `EventMap`/event-name constant/enum/types file anywhere** (canvas, core, or components) — greenfield; nothing to extend, must create the seam.
- **`Viewer.get<T>('eventBus')` is a generic escape hatch** — returns whatever `T` the caller asks for; a typed map does not retroactively constrain `get`-based access unless a typed accessor is added or callers annotate `EventEmitter<DiagramEventMap>`.
- **Command-name strings are NOT bus events** — `element.create/delete`, `elements.delete`, `element.resize`, `element.move` go through `commandStack.execute` (`modelling/commands.ts:260-273`); they must stay OUT of the EventMap (distinct namespace) to avoid conflating the two vocabularies.
- No ledger entries exist yet for an event-typing change (`docs/design/ledger.md` has B10 + C9 lessons only).

## Complete distinct bus event inventory (evidence-cited)

| Event (name) | Payload (args tuple) | Emit site |
|---|---|---|
| `d3canvas.init` / `d3canvas.destroy` / `d3canvas.clear` | `[]` | `Diagram.ts:65,74,78` |
| `canvas.init` / `canvas.destroy` | `[{ svg: SvgSelection }]` | `Canvas.ts:56,63` |
| `canvas.resized` / `canvas.zoomed` | `[]` | `Canvas.ts:122`, `zoom.ts:93` |
| `<class>.created` / `.updated` / `.removed` (class ∈ node/link/label/zone) | `[DrawingSelection, ModellingModelElement]` | `BaseElement.ts:92,119,131` |
| `<class>.moving` | `[DrawingSelection, def]` | `drag.ts:139` |
| `label.deleted` | `[lblElement, label]` | `ModellingElement.ts:79` |
| `<type>.<kind>` mouse matrix (4×9) | `[element, definition, event]` | `mouseEvents.ts:46` |
| `element.updated` | `[elementId: string, definition]` | (editor emit; core subscribes `Modelling.ts:95`) |
| `node.moved` | `[element, def]` | (drag release; subscribed `Links.ts:83`) |
| `elements.delete` | `[Array<{ definition }>]` | `selection.ts:79` |
| `background.click` | `[]` | `zoom.ts:146` |
| `selection.changed` | `[prev: SelectionEntry[], next: SelectionEntry[]]` | `selection.ts:44,60` |
| `outline.created` / `outline.updated` | `[element, definition, outline]` | `outline.ts:77,88` |
| `zoom.preZoom` | `[x, y, scale]` | `zoom.ts:73` |
| `zoom.start` / `zoom.end` / `zoom.init` | `[]` | `zoom.ts:133,141,182` |
| `zoom.to.element` | `[element, definition]` | `zoom.ts` subscribe `:153`; `SearchPanel.ts:136` emit |
| `commandStack.changed` | `[{ canUndo, canRedo }]` | `CommandStack.ts:202` |
| `document.changed` | `[{ dirty: boolean }]` | `CommandStack.ts:206` |
| `document.inconsistent` | `[aggregatedError]` | `CommandStack.ts:196` |
| `sidetab.registered` | `[sideTab]` | `SideTabsProvider.ts:37` |
| `PropertiesPanel.propertyChanged` | `[propertyId: string, definition]` | `EntryFactory.ts:71` |

## Recommended Scope (advisory, non-binding)

1. Define a base `interface DiagramEventMap` in `packages/canvas` (home of the `eventBus` token), keyed by event name → argument tuple; type the token as `EventEmitter<DiagramEventMap>`.
2. Augment it downstream via declaration merging: core (drawer/selection/outline/zoom/command/document events), interactive-viewer (`sidetab.registered`), editor (`PropertiesPanel.propertyChanged`).
3. Resolve the template-literal-name question in the debate (enumerate class×kind via template-literal key types vs. a pragmatic `${string}`-tolerant fallback).
4. Keep the change **compile-time only** — no runtime behavior, no module-registration reorder, one shared instance preserved. Ship as a Changesets minor across the touched packages.
5. Explicitly exclude command names (`element.*`, `elements.delete`) from the EventMap.
