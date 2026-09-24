# Implementation Plan: c15-coalesced-text-edit-undo

**Status**: `pending`
**Created**: 2026-09-24
**Design**: [design.md](./design.md)
**Test harness**: `pnpm --filter @d3-polytree/core test` and `pnpm --filter @d3-polytree/editor test` (vitest; CI `.github/workflows/ci.yml` runs `pnpm test` = `turbo run test`)
**Total Steps**: 5
**Review**: `not-reviewed`

---

## Execution Summary

Land the coalescing seam bottom-up: first the `CommandHandler.merge?` contract (Step 1), then the `CommandStack` when-to-merge logic + key lifetime (Step 2), then core tests (Step 3), then the editor producer — merge impl + session token (Step 4) — then editor/round-trip tests + changesets (Step 5). Core changes are independent of the editor and must land first because the editor depends on the new `execute` param and `merge?` member.

## Step Dependencies

- Step 2 requires Step 1: the stack calls `handler.merge?`, which must exist on the interface.
- Step 3 requires Steps 1–2: tests exercise the new stack behavior.
- Step 4 requires Steps 1–2: the producer passes `mergeKey` and implements `merge`.
- Step 5 requires Step 4.

---

### Step 1 — Add the `merge?` hook to `CommandHandler`

**Status**: `pending`
**Files**:
- `packages/core/src/command/CommandHandler.ts` — modify

**Evidence**:
- Confirmed via recon + `grep -n "postExecute" packages/core/src/command/CommandHandler.ts` → the interface is at `CommandHandler.ts:27-38` with optional `canExecute`/`preExecute`/`postExecute` and required `execute`/`revert`.
- `CommandContext` is the open string-keyed memento (`CommandHandler.ts:14-16`).

**Instructions**:
Append one optional member after `postExecute?` in the `CommandHandler<C>` interface:
`merge?(prev: C, next: C): boolean;`
Add a doc comment stating the contract exactly: the stack calls `merge` on the *surviving earlier* command's handler when it decides two consecutive top-level commands may coalesce (same `mergeKey`, live top, empty redo tail); the handler folds `next`'s forward state into `prev` **in place**, keeps `prev`'s captured pre-state, **must not mutate `next`**, and returns `true` to coalesce (return `false` or omit to record `next` as its own entry).

**Verification**: `pnpm --filter @d3-polytree/core typecheck` passes.

**Test**: N/A (interface + doc only; behavior is exercised by Step 3).

---

### Step 2 — Coalescing logic + mergeKey lifetime in `CommandStack`

**Status**: `pending`
**Files**:
- `packages/core/src/command/CommandStack.ts` — modify

**Evidence**:
- Close block `CommandStack.ts:82-91` (truncate `:86`, push `:87`, pointer `:88`, `_emitChanged` `:89`); nested-join guard `if (!opened) return` `:79-81`.
- `_handlers` is `Map<string, CommandHandler>` (`CommandStack.ts:39,57-59`); `Command.command` is the recorded name (`:6-9`).
- `_lastMergeKey` cleared points: `undo` `:118`, `redo` `:133`, `clear` `:155`, `_quarantine` `:183`.
- `execute` signature `:65`; `_pointer`/`_stack`/`_enabled` `:40-45`; `canUndo` pointer-derived `:108`.

**Instructions**:
1. Change `execute(command: string, context: CommandContext)` → `execute(command: string, context: CommandContext, mergeKey?: string)` (`:65`).
2. Add private field `_lastMergeKey: string | null = null` alongside `:40-45`.
3. In the close block, after `if (!opened) return;` and after `const txn = this._txn; this._txn = null;`, restructure to:
   - `if (this._enabled && txn.length > 0) {` — inside, before the existing truncate/push, attempt merge:
     `const top = this._stack[this._pointer];`
     `if (mergeKey != null && this._lastMergeKey === mergeKey && this._pointer >= 0 && this._pointer === this._stack.length - 1 && txn.length === 1 && top.length === 1) {`
     `  const handler = this._handlers.get(txn[0].command);`
     `  if (handler?.merge?.(top[0].context, txn[0].context)) { this._lastMergeKey = mergeKey; this._emitChanged(); return; } }`
   - Fall through to the existing truncate (`:86`) + push (`:87`) + pointer (`:88`), then `this._lastMergeKey = mergeKey ?? null;` then `this._emitChanged()`.
   - `} else { this._lastMergeKey = null; }` — a `canExecute` no-op (`txn.length === 0`) or pre-boot (`!_enabled`) close breaks any stale chain.
4. Add `this._lastMergeKey = null;` to `undo()` (`:118`), `redo()` (`:133`), `clear()` (`:155`), `_quarantine()` (`:183`).
5. Do **not** add the defensive `next.before != prev.after` veto in core (design Rejected Alternatives — it belongs to the handler if at all, and a bare `!=` would veto every merge).

**Verification**: `pnpm --filter @d3-polytree/core typecheck` passes; Step 3 tests green.

**Test**: paired in Step 3.

---

### Step 3 — CommandStack coalescing tests

**Status**: `pending`
**Files**:
- `packages/core/src/command/CommandStack.test.ts` — modify

**Evidence**:
- Vitest; `beforeEach` builds `bus`/`stack`/`model`, registers `add`, emits `d3canvas.init` (`CommandStack.test.ts:30-36`). Redo-tail test template `:83-91`; quarantine template `:119-138`; `_emitChanged` spy template `:148-157`.

**Instructions**: Add a `describe` with a generic handler exposing `merge` (folds `next.amount`/forward state into `prev`) registered under a name, driven via `execute(name, ctx, key)`. Cases:
1. merge-collapses-to-one-entry (two same-key executes → `_stack.length` grows by 1; one `undo` restores pre-first state).
2. redo-tail-resets-merge (after `undo`, next same-key execute truncates + pushes, does not merge).
3. quarantine-of-merged-entry (a merged entry whose `revert` throws routes through `_fail`, disables the stack, emits `document.inconsistent`).
4. different-key X→Y→X = 3 entries.
5. non-mergeable execute mid-burst (two-arg `execute`) breaks the chain.
6. two-arg backward-compat never merges (each its own entry).
7. handler-without-`merge` with a mergeKey falls back to push.
8. `_emitChanged` fires on a coalesce (`commandStack.changed`/`document.changed {dirty:true}` spy).

**Verification**: `pnpm --filter @d3-polytree/core test src/command/CommandStack.test.ts` — all green; each new test fails against the Step-1/2-reverted tree.

**Test**: this step is the test.

---

### Step 4 — Editor: implement `merge`, pass `mergeKey`, session token

**Status**: `pending`
**Files**:
- `packages/editor/src/properties-panel/PropertiesPanel.ts` — modify

**Evidence**:
- Handler registration `PropertiesPanel.ts:96-105`; `UpdatePropsContext` `:8-14`; `_commit` execute call `:200-216`; existing `selection.changed` listener `:118`; `debounce(...,300)` `:168`.

**Instructions**:
1. In `_registerUpdatePropertiesCommand()` (`:101-105`) add `merge: (prev, next) => { (prev as UpdatePropsContext).after = (next as UpdatePropsContext).after; return true; }` to the handler object.
2. Add a private `_editSession = 0`; in the existing `selection.changed` listener (`:118`) increment it (`this._editSession++`).
3. In `_commit` (`:210`), pass a third arg to `execute`: `` `${entry.definition.id}::${entryId}::${this._editSession}` ``.
4. Do not otherwise change `before`/`after` capture (`:205-215`) — each `_commit` still mints a fresh single-path `after`, so `prev.after = next.after` needs no clone.

**Verification**: `pnpm --filter @d3-polytree/editor typecheck` passes; Step 5 tests green.

**Test**: paired in Step 5.

---

### Step 5 — Editor tests, round-trip, changesets

**Status**: `pending`
**Files**:
- `packages/editor/src/properties-panel/index.test.ts` — modify
- `packages/editor/src/command.roundtrip.test.ts` — modify
- `.changeset/c15-coalesced-text-edit-undo.md` — create

**Evidence**:
- "routes a property edit through the command stack" test `index.test.ts:208-224`; `element.updated` spy `:199-205`. `assertGestureRoundTrip` snapshots full `exportDiagram()` before/after `command.roundtrip.test.ts:18-24`.
- Changeset format: `.changeset/config.json` (`baseBranch: main`, `access: public`).

**Instructions**:
1. `index.test.ts`: add (a) same-element-reselect = separate undo entries (dispatch edits, fire `selection.changed`, edit again → two `undo`s needed); (b) live-preview-intact (a debounced burst emits `element.updated` more than once while a single `undo` fully restores the pre-burst value).
2. `command.roundtrip.test.ts`: add a coalesced `updateProperties` burst case, then `assertGestureRoundTrip`'s single `undo` restores byte-identical `exportDiagram()`.
3. Create the changeset:
   ```md
   ---
   "@d3-polytree/core": minor
   "@d3-polytree/editor": patch
   ---
   Coalesce consecutive property-panel text edits into a single undo step via a
   CommandStack merge seam (CommandHandler.merge hook + optional execute mergeKey).
   ```

**Verification**: `pnpm --filter @d3-polytree/editor test` green; then full parity `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (mirrors CI `.github/workflows/ci.yml`).

**Test**: this step includes the tests.

---

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the step number, what changed, and why._
