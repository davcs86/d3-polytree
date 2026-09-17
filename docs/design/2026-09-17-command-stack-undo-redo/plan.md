# Implementation Plan: command-stack-undo-redo

**Status**: `pending`
**Created**: 2026-09-17
**Design**: [design.md](./design.md)
**Test harness**: `pnpm --filter @d3-polytree/core exec vitest run <file>` / `-t "<name>"` (cited `CLAUDE.md:30-31`); full `pnpm test` (`package.json:20`); lint `pnpm lint` (`package.json:21`), typecheck `pnpm typecheck` (`package.json:19`). No coverage threshold declared.
**Total Steps**: 13
**Review**: `not-reviewed`

---

## Execution Summary

Two PRs, per the design's operational-safety rollout. **PR-1 (Steps 1–9)** is core-only and must
stay net-green at every step: it builds the `commandStack` service (Steps 1–2), the `toXML`
round-trip harness (Step 3), then reroutes the four canvas gestures **one at a time behind the
harness** (create → delete → resize → move, Steps 4–7), demotes `Modelling` to a registration site
(Step 8), and adds the eslint tripwire (Step 9). **PR-2 (Steps 10–13)** exposes the component
surface: `undo()`/`redo()` + `document.changed` (Step 10), keyboard binding (Step 11), the
properties-panel property edits through `element.updateProperties` (Step 12), and the
boot/regression gate (Step 13). The order keeps CI green step-by-step (`CLAUDE.md:34`) and proves
the reroute is total before any undo/redo is user-reachable.

## Step Dependencies

- Steps 2, 3 require Step 1: they extend the `CommandStack`/module the first step creates.
- Steps 4, 5, 6, 7 require Steps 1–3: each dispatcher reroute needs the stack, the handler base, and the harness to gate it.
- Step 8 requires Steps 4–7: `Modelling`'s old mutation routes can only be removed once every dispatcher is rerouted.
- Step 9 requires Steps 4–8: the eslint tripwire's handler-glob allowlist must match the final handler locations, and no non-handler mutation may remain.
- Steps 10, 11 require Steps 1–8 (the stack must exist and be total before undo/redo is exposed).
- Step 12 requires Steps 1–3 (needs the stack + `element.updateProperties` handler + harness).
- Step 13 requires Steps 1–12 (final integration gate).
- PR boundary: Steps 1–9 = PR-1 (must be green + Step 9 tripwire passing) before Steps 10–13 (PR-2) begin.

---

### Step 1 — Scaffold the `command/` layer: `CommandStack` service, `CommandHandler` contract, `commandStackModule`

**Status**: `pending`
**Files**:
- `packages/core/src/command/CommandStack.ts` — create
- `packages/core/src/command/CommandHandler.ts` — create
- `packages/core/src/command/index.ts` — create
- `packages/core/src/index.ts` — modify

**Evidence**:
- didi `*Module` provider pattern to mirror: `modelling/index.ts:19-60` — `{ __init__: ['x'], x: ['type', X], __depends__: [...] }` (recon.md Patterns to REUSE).
- Core export site: `packages/core/src/index.ts:11` re-exports `./draw`, `./features`, `./modelling`, `./Diagram`, `./model/model` (recon area-C digest).
- eventBus is provided as `['type', EventEmitter]` (`packages/canvas/src/module.ts:15`); resolved by token `eventBus`.

**Instructions**:
- `CommandHandler.ts`: export `interface CommandContext { [k: string]: unknown }` (a plain memento — ids + plain values only, O13) and `interface CommandHandler<C extends CommandContext = CommandContext> { canExecute?(c: C): boolean; preExecute?(c: C): void; execute(c: C): void; revert(c: C): void; postExecute?(c: C): void }`.
- `CommandStack.ts`: `export class CommandStack` with `static readonly $inject = ['eventBus']`. Internal `_stack: {command:string; context:CommandContext}[][]` (each entry is a transaction = array of commands), `_pointer` (index into `_stack`), `_handlers = new Map<string, CommandHandler>()`, `_enabled = false`, and transaction bookkeeping `_txn: {command,context}[] | null`. Implement `registerHandler(name, handler)`, `execute(command, context)` (if a `_txn` is open, run the handler's execute and push to `_txn` — i.e. nested joins; else open a `_txn`, run, close, and if enabled push as one entry truncating the redo tail at `_pointer`), `undo()`/`redo()` (walk the entry, revert-in-reverse / execute-in-order), `canUndo()`/`canRedo()` (`_enabled && pointer in range`), `clear()`. Leave the latch + failure semantics to Step 2 (here `_enabled` starts false and nothing flips it yet).
- `command/index.ts`: `export const commandStackModule = { __init__: ['commandStack'], commandStack: ['type', CommandStack] as const }; export * from './CommandStack'; export * from './CommandHandler';`
- `index.ts`: add `export * from './command';` after the existing `./modelling` re-export (`index.ts:11`).

**Verification**: `pnpm --filter @d3-polytree/core typecheck` passes; `pnpm --filter @d3-polytree/core build` emits the new exports. Nothing consumes the service yet, so `pnpm test` stays green.

**Test**: `packages/core/src/command/CommandStack.test.ts` (new). Assert: a single `execute` then `undo` reverts; `redo` re-applies; a nested `execute` (from a `preExecute`) produces **one** entry (`canUndo()` true once, `undo()` reverts both); `execute` after `undo` truncates the redo tail (`canRedo()` false). Use fake handlers with in-memory state. Run: `pnpm --filter @d3-polytree/core exec vitest run src/command/CommandStack.test.ts` (`CLAUDE.md:30`). Author to fail before `CommandStack.ts` exists.

---

### Step 2 — Boot latch, failure semantics, and stack quarantine

**Status**: `pending`
**Files**:
- `packages/core/src/command/CommandStack.ts` — modify
- `packages/core/src/command/CommandStack.test.ts` — modify

**Evidence**:
- Latch signal: `Diagram` emits `d3canvas.init` **after** `createInjector` builds the injector (drawers + their boot `saveToModel` run synchronously inside `bootstrap` at `Diagram.ts:42,64`), and `d3canvas.destroy`/`d3canvas.clear` on teardown (`Diagram.ts:65,74,78`).
- Failure policy (design "Render channel, failure semantics"): best-effort unwind on execute-throw; on revert-throw, best-effort continue + quarantine + fatal `document.inconsistent` (design.md; `ROADMAP.md:552-554`).

**Instructions**:
- In the constructor, subscribe on the injected `eventBus`: `d3canvas.init` → `_enabled = true`; `d3canvas.destroy` and `d3canvas.clear` → `_quarantine()` (disable + clear both directions) so a re-boot starts clean.
- `execute`: wrap the transaction body in try/catch. On throw mid-transaction, best-effort `revert` the commands already applied in `_txn` (reverse order, each in its own try/catch collecting errors), discard `_txn` (never push), rethrow the original error.
- Add `_quarantine()`: `_enabled = false; _stack = []; _pointer = -1;` → `canUndo()`/`canRedo()` both false.
- `undo()`/`redo()`: wrap each command's `revert`/`execute` in try/catch; if any throws, continue the rest (best-effort full unwind), then call `_quarantine()`, `eventBus.emit('document.inconsistent', <aggregated error>)`, and rethrow the aggregated error.

**Verification**: `pnpm --filter @d3-polytree/core typecheck`; the Step-2 tests below pass.

**Test**: extend `CommandStack.test.ts`. Assert: `canUndo() === false` before any `d3canvas.init`, true after emitting it (with an entry); a handler whose `execute` throws inside a 3-command transaction leaves the other two reverted and pushes nothing; a handler whose `revert` throws during `undo()` still reverts the rest, fires `document.inconsistent`, and leaves `canUndo()`/`canRedo()` both false. Run: `pnpm --filter @d3-polytree/core exec vitest run src/command/CommandStack.test.ts`.

---

### Step 3 — `toXML` round-trip test harness utility

**Status**: `pending`
**Files**:
- `packages/core/src/command/roundtrip.testutil.ts` — create

**Evidence**:
- `ModelHost = { definitions, moddle }` and `moddle.toXML(definitions)` is the serialization (recon area-C: `model/model.ts:5`; `Viewer.exportDiagram` calls `moddle.toXML` per recon area-D).
- The router precondition to assert: all incident nodes drawn at revert time (`Links.ts:233-235`, design Open Risk).

**Instructions**:
- Export `async function assertGestureRoundTrip(host, commandStack, gesture: () => void)`: snapshot `s0 = await host.moddle.toXML(host.definitions)`; run `gesture()` (which dispatches command(s)); assert `toXML` now differs from `s0` (the gesture mutated something — guards against a no-op test); call `commandStack.undo()`; assert `await toXML() === s0` **only at the transaction boundary** (after the whole undo, never mid-transaction). Add an `assertAllIncidentNodesDrawn(host, drawingRegistry, linkDef)` helper used by the move/delete fixtures.
- This is a test-only util (no runtime export from `index.ts`).

**Verification**: imported and exercised by Steps 4–7; on its own, `pnpm --filter @d3-polytree/core typecheck`.

**Test**: N/A (test utility; its correctness is exercised by every gesture round-trip test in Steps 4–7).

---

### Step 4 — `element.create` handler + reroute the palette add-handlers

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/ModellingElement.ts` — modify
- `packages/core/src/modelling/index.ts` — modify
- `packages/core/src/modelling/Modelling.ts` — modify
- `packages/core/src/features/palette/BaseAddHandler.ts` — modify
- `packages/core/src/features/palette/AddLinkTool.ts` — modify

**Evidence**:
- Create today: `BaseAddHandler._create → this._modelling.doAction(this._className, 'create', [parameters])` (`palette/BaseAddHandler.ts:48`); `AddLinkTool._appendLink → modelling.doAction('link','create',[a,b])` (`palette/AddLinkTool.ts:112`).
- Create writes: `moddle.create('pfdn:Node', …)` + child label + `node.label` ref (`Nodes.ts:51-71`); persisted via `saveToModel` = `collections.add(this._definitions.get(localName), definition)` (`ModellingElement.ts:51-57`); inverse is `collections.remove` (recon Patterns to REUSE; `utils/collections.ts`).
- Registration site: `Modelling` already injects all four handlers (`Modelling.ts:27-34`).

**Instructions**:
- Give `ModellingElement` a `createCommand(): CommandHandler` (or equivalent) whose `execute` runs the existing create + `collections.add`, capturing the created element id(s) (node **and** its associated label) onto the context; `revert` calls `collections.remove` for both and reconciles them with `undefined`.
- In `Modelling` (registration site), on construction call `commandStack.registerHandler('element.create', …)` per element class (inject `commandStack` into `Modelling.$inject`).
- Change `BaseAddHandler._create` and `AddLinkTool._appendLink` to `commandStack.execute('element.create', { className, parameters })` instead of `modelling.doAction(..., 'create', ...)`. Keep `doAction` working for now (Step 8 removes it).
- Preserve current return-value behavior of `_create` (it returns the created def) so palette callers are unaffected.

**Verification**: `pnpm --filter @d3-polytree/core exec vitest run src/features/palette/palette.test.ts` and `src/modelling/` green; `pnpm --filter @d3-polytree/core typecheck`; `pnpm lint`.

**Test**: `packages/core/src/command/create.roundtrip.test.ts` (new) using Step 3's util: creating a node (with its label) then `undo()` returns `toXML` to the pre-create snapshot and removes both node and label from `definitions`. Run: `pnpm --filter @d3-polytree/core exec vitest run src/command/create.roundtrip.test.ts`.

---

### Step 5 — `element.delete` handler + reroute `Selection.deleteSelected` (one transaction)

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/ModellingElement.ts` — modify
- `packages/core/src/modelling/Modelling.ts` — modify
- `packages/core/src/features/selection.ts` — modify

**Evidence**:
- Delete today: soft-delete `definition.set('status', 3)` + drawer reconcile `undefined`, with read-only-label guard and cascade `label.deleted` (`ModellingElement.ts:64-84`).
- Multi-delete today: `Selection.deleteSelected()` emits N `.deleted` in a `forEach` (`selection.ts:70-75`).
- Selection snapshot for the whole set: `Selection.getSelectedElements()` (`selection.ts:77`).

**Instructions**:
- Add a delete `CommandHandler`: `execute` captures the element's prior `status` (and, for the cascade, the associated label's prior `status` and `isReadOnly`) onto the context, then runs the existing soft-delete + cascade; `revert` restores the captured `status`(es) + `isReadOnly` and reconciles node and label back in. Register as `element.delete` in `Modelling`.
- Rewrite `Selection.deleteSelected()` to open **one** transaction: `commandStack.execute` is called once at top level, and each selected element's delete is a nested `execute('element.delete', …)` that joins the transaction → one stack entry. Inject `commandStack` into `Selection.$inject` (currently `['eventBus']`, `selection.ts:22`).
- Keep emitting nothing extra; the handler's own reconcile drives the re-render (single render channel).

**Verification**: `pnpm --filter @d3-polytree/core exec vitest run src/features/features.test.ts src/modelling/modelling.test.ts` green (update the delete-emits-N assertion at `features.test.ts:108` to assert one transaction / the handler path); `pnpm lint`.

**Test**: `packages/core/src/command/delete.roundtrip.test.ts` (new): deleting a multi-selection of 2 nodes is **one** `undo()` that returns `toXML` to the pre-delete snapshot (both nodes' + labels' `status` restored). Run: `pnpm --filter @d3-polytree/core exec vitest run src/command/delete.roundtrip.test.ts`.

---

### Step 6 — `element.resize` handler + reroute `ResizeElement` (capture at drag start)

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/ModellingElement.ts` — modify (or a node-specific handler)
- `packages/core/src/modelling/Modelling.ts` — modify
- `packages/core/src/features/resizeElement.ts` — modify

**Evidence**:
- Resize writes `definition.size` and `definition.position.x/y` in place per tick (`resizeElement.ts:74-75,93,105`), gated to `pfdn:Node` (`resizeElement.ts:145`); it writes **no** `status` and never the label (design capture-set, round-3 verified).
- Commit fires `element.updated` with only `(id, definition)` (`resizeElement.ts:55-57`) — prior size/position already lost; the `'start'` hook is `_setCornerToDrag` (`resizeElement.ts:127-138`).

**Instructions**:
- Add a resize `CommandHandler`: context memento `{ id, from:{size,position:{x,y}}, to:{size,position:{x,y}} }` (all from model props, never `getBBox`/`attr`); `execute` idempotently applies `to`; `revert` applies `from` and reconciles the node. Register `element.resize`.
- In `_setCornerToDrag`'s `'start'` handler (`resizeElement.ts:133`), snapshot `{ size: Number(definition.size), position: { x, y } }` from the **model** before the first tick. Change `commit` (`resizeElement.ts:55`) to `commandStack.execute('element.resize', { id, from: snapshot, to: currentFromModel })` instead of emitting `element.updated`. Inject `commandStack` into `ResizeElement.$inject` (currently `['eventBus','canvas']`).

**Verification**: `pnpm --filter @d3-polytree/core exec vitest run src/features/resizeElement.test.ts` green (extend it to assert the model size/position commit + revert, which `resizeElement.test.ts:48,66` does not currently cover); `pnpm lint`.

**Test**: `packages/core/src/command/resize.roundtrip.test.ts` (new): resizing a node then `undo()` returns `toXML` (size + position) to the pre-resize snapshot. Run: `pnpm --filter @d3-polytree/core exec vitest run src/command/resize.roundtrip.test.ts`.

---

### Step 7 — `element.move` handler + reroute `Drag` (batched node+label capture, replay waypoints)

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/ModellingElement.ts` — modify (or a node/label move handler)
- `packages/core/src/modelling/Modelling.ts` — modify
- `packages/core/src/features/drag.ts` — modify

**Evidence**:
- Drag moves node **and** associated label by `dx/dy` (`drag.ts:45-58`), writing `position.x/y` and flipping `status`→2 unless `status===1` (`drag.ts:80-86`). Label reached via `v.definition.label` (`drag.ts:51`).
- Gesture lifecycle: `_setElemToDrag` d3drag `'start'` → select, `'drag'` → `applyOffsetToSelected`, `'end'` → `notifyMovedSelected` (`drag.ts:90-100`).
- Waypoints recompute on reroute; `updateNodeLinks` subscribes to **both** `node.moved` and `node.updated` (`Links.ts:83-84`); `reconcile → updateElement` emits `<class>.updated` (`draw/BaseElement.ts:131`) — verified round 3, so reconcile alone reroutes.

**Instructions**:
- Add a move `CommandHandler` taking a **batched** context: `{ items: [{ id, label?:{id}, from:{position,status, label?:{position,status}}, to:{…} }] }`. `execute` idempotently writes all `to` positions/statuses (node + label) for every item **first**, **then** reconciles every touched drawing (node + label) — never interleaved (the transaction-level write-before-reconcile invariant). `revert` writes all `from` values first, then reconciles all — the resulting `node.updated` events re-drive `updateNodeLinks`, recomputing incident-link waypoints from the restored positions (Option B; commands never touch `link.waypoint`). Do **not** re-emit `node.moved` explicitly (redundant — FIX-4).
- In `_setElemToDrag`'s `'start'` (`drag.ts:92`), snapshot each selected non-link element's + its label's `{position:{x,y}, status}` from the model, first-touch-wins for the gesture. Change `notifyMovedSelected` (`drag.ts:62`) to dispatch **one** batched `commandStack.execute('element.move', { items })` using the start snapshot as `from` and current model values as `to`; drop the per-element `<class>.moved` emit (the handler's reconcile drives the reroute). Keep `applyOffsetToSelected` writing live during drag (visual feedback = the `to` state). Inject `commandStack` into `Drag.$inject`.

**Verification**: `pnpm --filter @d3-polytree/core exec vitest run src/features/drag.test.ts src/modelling/links.test.ts` green (update `drag.test.ts:82`'s `.moved` expectation to the command path); `pnpm lint`.

**Test**: `packages/core/src/command/move.roundtrip.test.ts` (new): (a) moving a node+label then `undo()` returns `toXML` (node position+status, label position+status) to snapshot; (b) **the router fixture** — two nodes joined by one link, both selected and dragged, then `undo()` returns `toXML` including the link's waypoints to the pre-drag snapshot, asserting the shared link reverts correctly and all incident nodes are drawn at revert. Run: `pnpm --filter @d3-polytree/core exec vitest run src/command/move.roundtrip.test.ts`.

---

### Step 8 — Demote `Modelling` to a registration site; `doAction` → deprecated shim

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/Modelling.ts` — modify
- `packages/core/src/modelling/orchestrator.test.ts` — modify

**Evidence**:
- `Modelling._init()` currently routes `*.created`→`saveToModel`, `*.deleted`→`delete`, `element.updated`→`reconcile` (`Modelling.ts:73-98`); `doAction` at `Modelling.ts:60-71`.
- After Steps 4–7, create/delete/move/resize no longer flow through the `.created`/`.deleted` mutation routes.

**Instructions**:
- Remove the now-dead `*.created`→`saveToModel` and `*.deleted`→`delete` routes from `_init()`; **keep** the `element.updated`→`reconcile` subscription (still the notification path for external reconciles) and keep the draw-layer `.created`/`.deleted` events as pure notifications (boot-order invariant, `CLAUDE.md:73`). Keep `Modelling` as the `commandStack` registration site.
- Reduce `doAction` to a deprecated shim that delegates to `commandStack.execute` (mark `@deprecated`, remove before 1.0 per O12); do not delete it (a consumer may still call it in this minor).

**Verification**: `pnpm --filter @d3-polytree/core exec vitest run src/modelling/orchestrator.test.ts` green (update routing assertions at `orchestrator.test.ts:53,61` to reflect the removed routes); full `pnpm test`; `pnpm typecheck`; `pnpm lint`.

**Test**: extend `orchestrator.test.ts`: assert `.created`/`.deleted` no longer mutate the model directly (only the command path does), and the deprecated `doAction('node','create',…)` still creates via the stack. Run: `pnpm --filter @d3-polytree/core exec vitest run src/modelling/orchestrator.test.ts`.

---

### Step 9 — eslint `no-restricted-syntax` tripwire (defense-in-depth, not the proof)

**Status**: `pending`
**Files**:
- `eslint.config.js` — modify

**Evidence**:
- Flat config with a `rules` block and `js`/`tseslint` presets (`eslint.config.js:4-30`); `no-undef` is already overridden there (`eslint.config.js:24-28`).
- Real write primitives to fence: `collections.add`/`collections.remove` (`utils/collections.ts`, `ModellingElement.ts:53`) and moddle `.set(` (`ModellingElement.ts:82`, `drag.ts:85`). Bare `(x as Point).x =` / `.size =` assignments are type-erased and intentionally **not** covered (design: harness is the proof).

**Instructions**:
- Add a scoped config block: for `packages/core/src/**` **except** the handler files (a `files`/`ignores` glob naming `modelling/**` and `command/**` as the allowlist), add `no-restricted-syntax` entries flagging `CallExpression[callee.property.name='add']`/`'remove'` on a `collections` object and `CallExpression[callee.property.name='set']` on element-typed refs, with a message pointing at "route model mutations through a commandStack handler (design.md)". Keep it a **tripwire** — accompany it with a code comment that the `toXML` harness (Steps 4–7) is the authoritative totality gate.

**Verification**: `pnpm lint` passes (handlers exempt, no non-handler mutation remains after Step 8); temporarily adding a `collections.add(...)` call in a non-handler core file makes `pnpm lint` fail (verify, then revert).

**Test**: N/A (config-only; verified via `pnpm lint`).

---

### Step 10 — Component surface: `undo()`/`redo()` + `document.changed` dirty flag

**Status**: `pending`
**Files**:
- `packages/viewer/src/index.ts` — modify
- `packages/interactive-viewer/src/index.ts` — modify (re-export types if needed)
- `packages/editor/src/index.ts` — modify

**Evidence**:
- Service resolution pattern: `get<T>(token)` off the running Diagram (`viewer/src/index.ts:98`); Editor already uses it (`editor/src/index.ts:84-100`).
- get-before-load throws `/no diagram loaded/` (`viewer/src/index.test.ts:48`) — new methods must honor this.

**Instructions**:
- On `Viewer` (base), add `undo()`/`redo()`/`canUndo()`/`canRedo()` resolving `this.get<CommandStack>('commandStack')` (guard: same `no diagram loaded` error contract). Add a `document.changed` emission: subscribe once (post-boot) to `commandStack` pointer transitions and re-emit `document.changed` with a `dirty` boolean off the component (dirty = there is an undoable entry past the boot baseline). Debounce is a detail (design Open Risk) — a direct emit is acceptable for v1.
- Only expose on the classes that own mutation (undo/redo are meaningful on `InteractiveViewer`/`Editor`; on the static `Viewer` `canUndo()` is simply always false since it boots no command dispatchers — keep the method for a uniform surface but document it).

**Verification**: `pnpm --filter @d3-polytree/editor exec vitest run src/index.test.ts`; `pnpm typecheck`; `pnpm lint`.

**Test**: extend `editor/src/index.test.ts`: after a create, `editor.canUndo()` is true and `undo()` restores; `document.changed` fires with `dirty:true` on the first mutation and `dirty:false` after undoing back to the baseline. Run: `pnpm --filter @d3-polytree/editor exec vitest run src/index.test.ts`.

---

### Step 11 — Keyboard binding: Ctrl+Z / Ctrl+Shift+Z in `InteractiveViewer`/`Editor`

**Status**: `pending`
**Files**:
- `packages/interactive-viewer/src/index.ts` — modify

**Evidence**:
- **Not found** — no existing keyboard/keydown handling anywhere in the components (recon area-D: only `click`/`input`/`change` listeners in panels). Created from scratch.
- Boot seam to attach after: `Viewer._boot(host)` (`viewer/src/index.ts:114-135`); container from `options.container`.

**Instructions**:
- In `InteractiveViewer` (so `Editor` inherits), after boot attach a `keydown` listener on the component container: Ctrl/Cmd+Z → `this.undo()`; Ctrl/Cmd+Shift+Z (and optionally Ctrl+Y) → `this.redo()`; guard against firing while focus is in a panel `<input>`/`<textarea>` (check `event.target`). Remove the listener in `destroy()`.

**Verification**: `pnpm --filter @d3-polytree/interactive-viewer exec vitest run src/index.test.ts`; `pnpm typecheck`; `pnpm lint`.

**Test**: extend `interactive-viewer/src/index.test.ts`: dispatch a synthetic `KeyboardEvent('keydown',{key:'z',ctrlKey:true})` on the container after a mutation and assert `undo()` ran (model reverted); assert a keydown whose `target` is an `<input>` is ignored. Run: `pnpm --filter @d3-polytree/interactive-viewer exec vitest run src/index.test.ts`.

---

### Step 12 — `element.updateProperties` handler + reroute the properties-panel edits

**Status**: `pending`
**Files**:
- `packages/core/src/modelling/ModellingElement.ts` — modify (add the handler) + register in `Modelling`
- `packages/editor/src/properties-panel/PropertiesPanel.ts` — modify
- `packages/editor/src/properties-panel/PfdnPropertiesProvider.ts` — modify

**Evidence**:
- Property write today: `entry.scope.set(entry.definition, props)` (`PropertiesPanel.ts:171`) then `updateDrawing` emits `element.updated` for the node and its label (`PfdnPropertiesProvider.ts:147,151`).
- Edited props are serialized (name/tag/text/color/property values) — `PfdnPropertiesProvider.ts:32-119`.

**Instructions**:
- Add an `element.updateProperties` `CommandHandler`: context `{ id, before: {…prior values of the edited keys…}, after: {…new values…} }` (plain values only); `execute` applies `after` via the same `scope.set` semantics and reconciles node (+label); `revert` applies `before` and reconciles. Register in `Modelling`.
- Change `PropertiesPanel`'s apply path (`PropertiesPanel.ts:171`) to read the current values of the keys in `props` first (that becomes `before`), then dispatch `commandStack.execute('element.updateProperties', { id, before, after: props })` instead of a bare `scope.set` + `element.updated`. Inject `commandStack` into the panel/provider as the editor resolves core services.

**Verification**: `pnpm --filter @d3-polytree/editor exec vitest run src/properties-panel/index.test.ts` green (the panel tests at `index.test.ts:60,110,177` must still pass, now through the command path); `pnpm typecheck`; `pnpm lint`.

**Test**: `packages/editor/src/properties-panel/updateProperties.roundtrip.test.ts` (new): rename a node via the panel entry, then `undo()` restores the prior `name` and re-reconciles — `toXML` returns to snapshot. Run: `pnpm --filter @d3-polytree/editor exec vitest run src/properties-panel/updateProperties.roundtrip.test.ts`.

---

### Step 13 — Boot + regression integration gate

**Status**: `pending`
**Files**:
- `packages/editor/src/index.test.ts` — modify (or a new integration test)

**Evidence**:
- Boot hazard invariant: `canUndo() === false` immediately after `importDiagram` (design; `ROADMAP.md:572-576`).
- Folded-panel boot-order tests to keep green: `interactive-viewer/src/index.test.ts:28-63`, `editor/src/index.test.ts:75-86` (recon area-D).

**Instructions**:
- Add an integration test asserting `editor.canUndo() === false` right after `importDiagram(fixtureXml)` (proves the boot render did not enter the stack). Confirm the folded-panel ordering tests still pass unchanged (do not modify them — they are the boot-order guard). Run the full pipeline locally to mirror CI (`CLAUDE.md:34`).

**Verification**: full CI mirror: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook` all green (`CLAUDE.md:34-36`, `.github/workflows/ci.yml:22-39`).

**Test**: `packages/editor/src/index.test.ts` (extend): `canUndo()===false` post-import; a create→undo→redo cycle round-trips `toXML`. Run: `pnpm --filter @d3-polytree/editor exec vitest run src/index.test.ts`, then `pnpm test`.

---

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the step number, what changed, and why._
