# Recon: c15-coalesced-text-edit-undo

**Created**: 2026-09-24
**Change**: Add a `CommandStack` merge seam (mergeKey / replace-top-transaction) so consecutive same-target `element.updateProperties` commands collapse into ONE undo transaction while keeping live preview (roadmap C15, `ROADMAP.md:538`).
**Depth**: full
**Affected areas**: `packages/core/src/command`, `packages/editor/src/properties-panel`

---

## Repo Profile

pnpm + Turborepo monorepo publishing `@d3-polytree/*` TS/ESM packages on modular D3 v7. Tooling: vitest (jsdom) per package, tsc `--noEmit` typecheck, eslint flat config, prettier. CI order (`.github/workflows/ci.yml`): install → lint → format:check → typecheck → test → build → build-storybook. The engine is wired with **didi**; `CommandStack` (C1) is the invertible/atomic mutation primitive already shipped.

## Codebase Map

- **`packages/core/src/command`** (TS)
  - Entry point: `packages/core/src/command/CommandStack.ts` — the stack service (`static $inject = ['eventBus']`, `:36`).
  - `Transaction = Command[]` — the unit of undo/redo (`CommandStack.ts:12`); `Command = { command, context }` (`:6-9`).
  - Private state: `_stack: Transaction[]` (`:40`), `_pointer` (`:42`), `_txn` open accumulator (`:44`), `_enabled` boot latch (`:45`).
  - **Push site (the seam)**: `execute()` `:82-91` — after a top-level txn closes: `_stack.length = _pointer+1` (redo-tail truncate, `:86`), `_stack.push(txn)` (`:87`), `_pointer = _stack.length-1` (`:88`), `_emitChanged()` (`:89`).
  - `undo()` `:118`, `redo()` `:133`, `canUndo()` `:108`, `canRedo()` `:113`, `clear()` `:155`.
  - `_quarantine()` `:183-188` (bound to `d3canvas.destroy`/`.clear`, `:52-53`), `_fail()` `:191-199` (emits `document.inconsistent`, throws), `_emitChanged()` `:201-208` (emits `commandStack.changed {canUndo,canRedo}` + `document.changed {dirty: canUndo}`).
  - Handler contract: `packages/core/src/command/CommandHandler.ts` — `CommandContext` open string-keyed bag `:14-16` (the memento); `CommandHandler<C>` optional `canExecute`/`preExecute`/`postExecute`, required `execute`/`revert` `:27-38`.
  - Barrel: `packages/core/src/command/index.ts` exports `CommandStack`, types, `commandStackModule`.
- **`packages/editor/src/properties-panel`** (TS)
  - `element.updateProperties` command + handler registered **by the panel**: `PropertiesPanel._registerUpdatePropertiesCommand()` `:96-105` — plain `execute`/`revert` only (no pre/post/canExecute).
  - Context: `UpdatePropsContext` `:8-14` = `{ scope, definition, before, after }`.
  - Producer: `_commit(entryId, newValue)` `:200-216` builds `after`/`before` via `deepSet`/`deepGet`, calls `commandStack.execute('element.updateProperties', ctx)`.
  - **300ms debounce**: `_registerInputChangeHandlers()` `:162-186` — `debounce(..., 300)` at `:168` for `input` events; `change` events apply immediately `:175-180`. `debounce` helper `utils.ts:37-48` (trailing-edge). `deepGet`/`deepSet` `utils.ts:16-34`.
  - Live preview: `PfdnPropertiesProvider.updateDrawing` `:181-193` emits `element.updated` per commit — must NOT be suppressed by merging.
  - Tests covering area: `packages/core/src/command/CommandStack.test.ts` (vitest); `packages/editor/src/command.roundtrip.test.ts` (`assertGestureRoundTrip` `:18-24`); `packages/editor/src/properties-panel/index.test.ts:208-224` (routes edit through stack → undoable).

## Patterns to REUSE

- The undo-transaction model → reuse `Transaction`/`_stack`/`_pointer` (`CommandStack.ts:12,40-44`); the seam is a branch inside the existing push block `:85-90`, not a new structure.
- Merge-key data → derive from the existing `UpdatePropsContext` (`PropertiesPanel.ts:8-14`): `definition.id` + dotted entry path. Do not add a new context type.
- Test style → mirror `CommandStack.test.ts` inline-handler + `vi.fn()`/`bus.on` assertions; the redo-tail test (`:83-91`) and quarantine test (`:119-138`) are the direct templates.
- Round-trip fidelity → extend `command.roundtrip.test.ts` `assertGestureRoundTrip` (`:18-24`).

## Host Conventions & Hard Rules

- **Hard rule** (root `CLAUDE.md`, "didi" invariant 1): "**Last definition of a token wins.**" — the seam must not reorder module/handler registration.
- **Hard rule** (root `CLAUDE.md`, invariant 2): "**Boot order = event-subscription order.**" Drawers emit `<class>.created` during boot; created-listeners register before drawers. The stack stays disabled until `d3canvas.init` (`CommandStack.ts:51,84`) — merging must not fire on the boot render.
- **Hard rule** (`packages/editor/CLAUDE.md` `EDITOR-01`): "`element.updateProperties` is the one editor-owned command." Merge logic must not move command ownership out of the editor.
- **Hard rule** (`ROADMAP.md:669-676` §12.5 testing): `execute → revert` must restore a byte-identical `moddle.toXML()` for every command — a merged burst must still round-trip.
- Convention: all tooling is Python-free TS; tests are vitest co-located `*.test.ts`.

## Dependencies

- Data / schema: none (undo-stack in-memory only).
- External contracts: `CommandStack.execute` signature — if a `mergeKey` is added as a param or context field it is an additive change to a `@d3-polytree/core` export; `UpdatePropsContext` is editor-internal.
- Config / environment: none.
- Cross-area edges: `packages/editor` → `packages/core` command surface (editor registers the handler and calls `execute`).

## Risks / Not-found

- **Ledger trap `2026-09-17 command-stack-undo-redo` (complete write-set)**: a gesture may write more serialized props than the obvious one; a coalesced text edit still only touches `updateProperties` scope, but the round-trip test is the authoritative guard.
- **Redo-tail semantics**: after an `undo`, a new edit must NOT merge into the now-behind entry — it must truncate the tail and start fresh (merge valid only when the mergeable entry is the current top with empty redo tail).
- **Quarantine semantics**: a merged entry whose `revert` throws must quarantine identically (`_fail`).
- **Merge-key lifetime**: a burst must not merge across an intervening `undo`/`redo`/`clear`/selection change / different target. Not found: any existing "last merge key" tracking — created from scratch.
- **Live preview**: `updateDrawing` per-commit emits must stay; merging affects only the undo entry, not the applied side effects.

## Recommended Scope

Add an optional merge key to the execute path (context field or third param) and a replace-top branch in `CommandStack.execute` `:85-90` guarded by (redo tail empty) AND (top entry's merge key equals the incoming key). Track the last committed merge key; clear it on `undo`/`redo`/`clear`/`_quarantine` and on any non-mergeable execute. Producer supplies `definition.id + entryId` from `PropertiesPanel._commit`. A merged replacement keeps the earliest `before` and newest `after`. Tests: merge-collapses-to-one-entry, redo-tail-resets-merge, quarantine-of-merged-entry, and a coalesced round-trip (typing burst = one Ctrl+Z restoring pre-burst value, live preview intact).
