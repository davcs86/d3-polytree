# Design: c15-coalesced-text-edit-undo

**Created**: 2026-09-24
**Depth**: full
**Rounds**: 2 (termination: approved)
**Approved by**: user @ 2026-09-24
**Grounded in**: recon.md

---

## Chosen Approach

Add a **coalescing seam** to `CommandStack` split cleanly by owner — _the stack decides WHEN, the handler decides HOW, the producer decides the session boundary_ — so a debounced typing burst in the properties panel collapses to a single undo transaction while every keystroke still updates the live drawing.

**(A) Core — `CommandStack` (`packages/core/src/command/CommandStack.ts`).** `execute` gains an optional third parameter `execute(command, context, mergeKey?: string)` (backward-compatible; existing two-arg callers unchanged). A private `_lastMergeKey: string | null = null` tracks the in-flight burst. The transaction-close block (`CommandStack.ts:82-91`) gains one branch: when a top-level transaction closes with `_enabled && txn.length > 0` and `mergeKey != null && _lastMergeKey === mergeKey && _pointer >= 0 && _pointer === _stack.length - 1 (empty redo tail) && txn.length === 1 && top.length === 1`, it resolves the surviving top command's handler via `_handlers.get(txn[0].command)` and calls `handler.merge?.(top[0].context, txn[0].context)`; if it returns `true`, the incoming transaction is _coalesced_ into the current top (no push, `_pointer` unchanged), `_lastMergeKey` is set, `_emitChanged()` fires, and execute returns. Otherwise the existing truncate-tail + push + pointer-advance path runs and `_lastMergeKey = mergeKey ?? null`. `_lastMergeKey` is assigned only on a real top-level close (after the `if (!opened) return` nested-join guard, `CommandStack.ts:79-81`); it is cleared to `null` in `undo`/`redo`/`clear`/`_quarantine` and on any `canExecute`-gated no-op (`txn.length === 0`) or pre-boot (`!_enabled`) close, so a burst cannot merge across a navigation.

**(B) Core — `CommandHandler` coalescing hook (`packages/core/src/command/CommandHandler.ts:27-38`).** Append one optional member: `merge?(prev: C, next: C): boolean`. Contract: the stack calls it on the _surviving earlier_ command's handler with `prev` = the earlier memento and `next` = the newer one; the handler folds `next`'s forward state into `prev` **in place**, keeps `prev`'s captured pre-state, must not mutate `next`, and returns `true` to coalesce (a `false`/absent `merge` records `next` as its own entry). The stack never names an editor-owned field — this removes the layering leak.

**(C) Editor — the mergeable command + session boundary (`packages/editor/src/properties-panel/PropertiesPanel.ts`).** `element.updateProperties` (registered at `PropertiesPanel.ts:96-105`, EDITOR-01) implements `merge: (prev, next) => { (prev as UpdatePropsContext).after = (next as UpdatePropsContext).after; return true; }` — keeping the earliest `before` and taking the newest `after`, so one Ctrl+Z reverts to the pre-burst value. Because `_runCommand` applies `next.after` and emits `element.updated`/`updateDrawing` _before_ the close block runs (`CommandStack.ts:71,102`; `PropertiesPanel.ts:98-99`), live preview is untouched. The panel adds `_editSession = 0`, bumped in its existing `selection.changed` listener (`PropertiesPanel.ts:118`), and folds it into the key passed from `_commit` (`:210`): `` `${entry.definition.id}::${entryId}::${this._editSession}` ``. A reselection rotates the token, so a second edit on the same field after reselecting is a _different_ mergeKey → a separate undo entry, with zero new core coupling to the feature event.

Shipped as a Changesets **minor** on `@d3-polytree/core` (new `merge?` on the public `CommandHandler`, new `execute` param) + a **patch** on `@d3-polytree/editor` (implements the hook).

## Rejected Alternatives

- **mergeKey + stack overwrites `context.after` directly** (Round-1 approach) — rejected: hard-codes an editor-owned memento field name into core (`DN-8` layering leak); a future mergeable command storing forward state under a different key would replay stale state on redo.
- **`merge?` with a defensive `next.before != prev.after` veto as written** — rejected as written: `before`/`after` are distinct `deepSet` Records, never reference-equal, so a bare `!=` would veto _every_ merge; if kept at all it must be a path-value comparison, and it is belt-and-suspenders only.
- **Flush-on-commit (debounce to blur/Enter, no coalescing)** — rejected: removes per-keystroke live drawing preview, which the feature explicitly wants.
- **Store the merge key per stack entry** — rejected: redo must break the chain; an entry-stored key would wrongly re-merge into a just-redone entry.
- **Time/idle-based coalescing in the stack** — rejected: the 300 ms debounce (`PropertiesPanel.ts:168`) already batches keystrokes into commits; time plays no role at the stack.
- **`top.length === txn.length` + per-index loop** — rejected as dead generality (`DN-7`): the only mergeable producer emits a length-1 transaction (`PropertiesPanel.ts:96-105` has no pre/postExecute); collapsed to a `txn.length === 1 && top.length === 1` guard.

## Open Risks

- [ ] **Public `merge?` hook misuse** — a third-party handler that mutates `next` or returns `true` without folding forward state silently drops an undo entry; the round-trip test only guards `element.updateProperties`. To be addressed at the implementation step with a strict interface contract doc + `merge` reachable only behind an opt-in `mergeKey`.
- [ ] **Pre-existing debounce-across-reselect hazard** — a trailing debounced commit can fire after a reselection; the session token guarantees a distinct undo entry (not a wrong merge), and this is orthogonal/pre-existing. Optional hardening (cancel/flush the pending debounce in the `selection.changed` listener) noted for the plan, not required.
- [ ] **Restructured close block must gate strictly on `_enabled`** and leave `_lastMergeKey` untouched when disabled (pre-boot) — to be covered by an explicit code path + comment.

## Principles & Host Rules Touched

- `DN-8` (SOLID) — honored by: the `CommandHandler.merge?` hook so the stack decides _when_ and the handler owns _how_ it coalesces its own memento; core never names `after`.
- `DN-7` (YAGNI) — honored by: the length-1 guard replacing the speculative multi-command loop.
- `DN-2` (reuse) — honored by: reusing `Transaction`/`_stack`/`_pointer` and the existing `UpdatePropsContext` (no new context type), and the existing `assertGestureRoundTrip` harness.
- Host rule "`execute → revert` must restore a byte-identical `moddle.toXML()`" (recon "Host Conventions & Hard Rules", `ROADMAP.md:669-676`) — honored by: a coalesced entry is structurally identical to one `updateProperties` with `before` = earliest / `after` = latest; final model = `prev.after`, undo target = `prev.before`; adversary-verified no residue.
- Host rule boot latch (stack disabled until `d3canvas.init`, `CommandStack.ts:51,84`) — honored by: merge reachable only inside `_enabled && txn.length > 0`.
- Host rule `EDITOR-01` ("`element.updateProperties` is the one editor-owned command", `packages/editor/CLAUDE.md`) — honored by: the merge implementation and session boundary live entirely in the editor; core stays command-agnostic.
- Host rule "Last definition of a token wins" — honored by: no change to module/handler registration order.

## Waivers

None — the Round-2 adversary verdict was SOUND with no floor breach; all residual objections are norm-level and folded into Open Risks / the plan.
