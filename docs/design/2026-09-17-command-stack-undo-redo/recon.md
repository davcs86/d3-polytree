# Recon: command-stack-undo-redo

**Created**: 2026-09-17
**Change**: Introduce a `commandStack` service in `@d3-polytree/core` giving transactional undo/redo; reroute all model mutation through registered command handlers (execute/revert); make multi-element gestures one transaction; add `undo()`/`redo()` + a `document.changed` dirty flag to the components. (RFC: `ROADMAP.md` §12, phase B10, decisions O11–O13.)
**Depth**: deep
**Affected areas**: `packages/core/src/modelling/`, `packages/core/src/features/`, `packages/core/src/{Diagram.ts,model/,draw/,index.ts}`, `packages/{viewer,interactive-viewer,editor}/src/`

---

## Repo Profile

TypeScript/ESM monorepo (pnpm 10 + Turborepo) publishing `@d3-polytree/*`; the engine is `@d3-polytree/core`, wired with the `didi` DI container; eventBus is a plain `eventemitter3` singleton. Tests are Vitest/jsdom per package. CI runs exactly `install --frozen-lockfile → lint → typecheck → test → build → build-storybook` (`.github/workflows/ci.yml:22-39`, `CLAUDE.md:34-36`). `ROADMAP.md` §12 already carries the RFC for this change.

## Codebase Map

- **`packages/core/src/modelling/`** (TS)
  - Orchestrator: `Modelling.ts` — `$inject` `Modelling.ts:27`; generic `doAction(cls,action,params)` `Modelling.ts:60`; event routes `Modelling.ts:73-98` (`*.created`→`saveToModel`, `*.deleted`→`delete`, `element.updated`→`reconcile`).
  - Base handler: `ModellingElement.ts` — `saveToModel` = `collections.add(this._definitions.get(localName), definition)` `ModellingElement.ts:51-57`; `delete` = **soft-delete** `definition.set('status', 3)` + drawer reconcile `undefined`, with read-only-label guard and cascade `label.deleted` `ModellingElement.ts:64-84`.
  - Handlers: `Nodes.ts:47-75` (moddle.create `pfdn:Node`, child read-only label, `pfdn:Coordinates`), `Labels.ts:37-51` (reconciles twice), `Zones.ts:33-36` (`create()` returns null — placeholder), `Links.ts:87-124` (create) and `Links.ts:348` (`link.waypoint = waypoints` reroute on `node.moved`).
  - Ids assigned by moddle on `create` (handlers read `.id` immediately after) — `Nodes.ts:50-51`.
  - Tests: `modelling.test.ts`, `orchestrator.test.ts`, `links.test.ts` — assert routing + handler behavior; **no `toXML`/round-trip assertions**.
- **`packages/core/src/features/`** (TS) — two mutation-dispatch paths:
  - Emit-and-route (inject `eventBus` only): `Selection.deleteSelected()` emits N `.deleted` in a `forEach` `selection.ts:70`; `Drag` writes `position.x/y` in place + emits `.moving`/`.moved` `drag.ts:80,62` (**`.moved` is NOT routed by Modelling**); `ResizeElement` writes `size`/`position` in place + emits `element.updated` `resizeElement.ts:55`.
  - Direct call (inject `modelling`): `BaseAddHandler._create → modelling.doAction(class,'create',[…])` `palette/BaseAddHandler.ts:48`; `AddLinkTool._appendLink` `palette/AddLinkTool.ts:112`.
  - `LocalStorage.save()` `localStorage.ts:45` fires only on the palette save button `palette/PaletteProvider.ts:115`; injects `d3polytree`+`notifications`, **no eventBus, no dirty flag**.
  - Tests: `features.test.ts:108` (delete-emits-N), `drag.test.ts:45,82`, `resizeElement.test.ts:48,66` (asserts handle geometry, **not** the model size commit), `palette/palette.test.ts:94` (delegation via mocks).
- **`packages/core/src/{Diagram.ts, model/, draw/, index.ts}`** (TS)
  - `Diagram.ts` — injector from module list, eager `injector.get()` of every `__init__` `Diagram.ts:23`; `get<T>` `:63`; `destroy()` emits `d3canvas.destroy` `:73`; constructor emits `d3canvas.init` **after** the injector is built (i.e. after drawers render).
  - `eventBus` = `['type', EventEmitter]` shared singleton `packages/canvas/src/module.ts:15`; **untyped** (`import type EventEmitter from 'eventemitter3'`).
  - Boot render: `BaseElement._init` iterates definitions in the drawer constructor `draw/BaseElement.ts:142` and emits `<class>.created` per element `draw/BaseElement.ts:119` — **the mutation round-trip the RFC warns about**.
  - Survives-the-reroute notification path: `reconcile → _builder → updateElement` emits `<class>.updated` `draw/BaseElement.ts:122,131`.
  - `ModelHost = { definitions, moddle }` `model/model.ts:5`; `d3polytree` is a `['value', host]` module `model/model.ts:64`.
  - Export pattern to mirror: per-feature `*Module` objects + classes/types re-exported from `index.ts:11` / `draw/index.ts:34`.
  - Tests: `Diagram.test.ts` (boot/extra-modules/destroy), `model/model.test.ts` (dotted DI tokens, load round-trip of definition arrays).
- **`packages/{viewer,interactive-viewer,editor}/src/`** (TS) — `Editor extends InteractiveViewer extends Viewer`.
  - `Viewer._boot(host)` composes `getModules()` + `options.modules` (last-wins) + `d3polytree` value `viewer/src/index.ts:114-135`; `get<T>(token)` resolution `:98`; get-before-load throws `index.test.ts:48`.
  - `InteractiveViewer.interactionModules` (features before drawers) `interactive-viewer/src/index.ts:34-52`; `Editor.editionModules` incl. `modellingModule` `editor/src/index.ts:51-82`; `Editor` public methods resolve via `get()` `editor/src/index.ts:84-100`.
  - **No keyboard wiring anywhere** — Ctrl+Z/Ctrl+Shift+Z is greenfield. Boot-order/folded-panel invariant tests in each `index.test.ts`.

## Patterns to REUSE

- `commandStack` service + handler registration → the didi `*Module` provider pattern `['type', Class]` with `__init__`/`__depends__` (`modelling/index.ts:19-60`, exported as in `index.ts:11`).
- Service access from components → `get<T>('commandStack')` off the running `Diagram` (`viewer/src/index.ts:98`).
- `saveToModel` execute / revert → the existing `collections.add` / `collections.remove` primitives (`utils/collections.ts`).
- `delete` inverse → already a status flag: `definition.set('status', …)`; revert restores the prior status (`ModellingElement.ts:64`).
- Re-render after a command → the surviving `drawer.reconcile` / `element.updated` notification path (`draw/BaseElement.ts:122`).
- Enable-after-boot latch → the existing `d3canvas.init` (post-render) / `d3canvas.destroy` lifecycle events (`Diagram.ts:63,73`).

## Host Conventions & Hard Rules

- Convention: DI boot order & module composition — `CLAUDE.md`, `packages/core/CLAUDE.md`.
- **Hard rule**: "**Last definition of a token wins.** Composing a module after the core modules overrides that token." — `CLAUDE.md:69`
- **Hard rule**: "Do not reorder so a core module lands last." — `CLAUDE.md:71`
- **Hard rule**: "**Boot order = event-subscription order.**" — `CLAUDE.md:73`
- **Hard rule**: "Moving a created-listener after the drawers silently drops the initial elements — a real bug the folded-panel tests guard against." — `CLAUDE.md:76`
- **Hard rule**: "**jsdom shims are intentional.** … don't \"fix\" them as if they were bugs." — `CLAUDE.md:93-96`
- **Hard rule**: "D3 slices are peer deps — import from the specific `d3-*` package, never a `d3` bundle." — `packages/core/CLAUDE.md:22`
- **Hard rule**: "CI … runs exactly: install (frozen) → lint → typecheck → test → build → build-storybook. Mirror that before pushing." — `CLAUDE.md:34-36`
- Self-imposed (RFC §12, this change's own spec — binding as accepted design): boot render must not enter the stack (`ROADMAP.md:573-576`); a lint rule bans direct `definitions.*` writes outside a handler (`ROADMAP.md:601-602`); command contexts hold ids + plain values only (O13, `ROADMAP.md:538-539`); created/deleted events remain notifications (`ROADMAP.md:566-568`).

## Dependencies

- Data / schema: the moddle `.pfdn` tree — collection membership (`definitions.get(localName)`) + element props (`status`, `position`, `size`, `label`, `text`, `waypoint`, `source`, `target`). `toXML` round-trip is the fidelity target.
- External contracts: `@d3-polytree/core` public exports (`index.ts`) + component public methods; `undo()`/`redo()`/`document.changed` are additive; O12 permits pre-1.0 breaking changes to `Modelling.doAction`/`ModellingElement`.
- Config / environment: none new.
- Cross-area edges: features → (`eventBus` | `modelling.doAction`) → `Modelling` → handlers → moddle tree; drawers emit `.created`/`.updated`; components resolve services via `get()`.

## Risks / Not-found

- **No `toXML` round-trip assertions exist today** — the RFC's central execute↔revert fidelity invariant is greenfield and must be built as part of the change.
- **Node move is not a Modelling mutation today**: `Drag` writes `position` in place and `.moved` is unrouted (`drag.ts:80`), so there is no existing handler action to wrap for an undoable move — new command territory.
- **Link waypoint reroute is derived state** written on `node.moved` (`Links.ts:348`): whether a move records waypoints in the undo entry, or waypoints are recomputed on revert, is an open design fork.
- **Resize already writes the model in place** before emitting `element.updated` (which only triggers a re-render, not a second persist) (`resizeElement.ts:55`) — the "mutation" precedes its event.
- **`create` is not evented** (direct `doAction`), so the reroute has two entry shapes (evented delete/update vs direct create).
- **eventBus is untyped** — typed command/event surfaces are new work (couples to C12).
- `Zones.create` is a no-op placeholder (`Zones.ts:33`).
- Only enable-after-boot signal is `d3canvas.init`, emitted after the injector is built (hence after drawers already rendered) — usable as the latch, but there is no dedicated "boot complete" event.

## Recommended Scope

Advisory (input to the debate + impl-plan, not binding):

- New `commandStack` service + `CommandHandler` contract + registration, following the didi `*Module` export pattern; a natural seam is to make `Modelling` the registration site while keeping its notification subscriptions.
- Convert the three real write mechanisms (`collections.add`/`remove`, soft-delete `status`, direct prop sets) into command handlers with `execute`/`revert`; candidate vocabulary: `element.create`, `element.delete`, `element.move`, `element.resize`, `element.updateProperties`, `link.create`, `link.updateWaypoints`.
- Reroute the dispatchers: `Selection.deleteSelected` → one transaction; `Drag` `.moved` → move command; `ResizeElement` commit → resize command; palette `create` → create command.
- Latch the stack to enable only after boot (via `d3canvas.init`), with a test asserting `canUndo() === false` post-`importDiagram`.
- Add `undo()`/`redo()`/`document.changed` to the components; bind Ctrl+Z/Ctrl+Shift+Z in `interactive-viewer`/`editor`.
- Build the `toXML` execute↔revert round-trip test harness as the fidelity net.
