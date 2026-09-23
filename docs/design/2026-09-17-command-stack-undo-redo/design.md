# Design: command-stack-undo-redo

**Created**: 2026-09-17
**Depth**: deep
**Rounds**: 3 (termination: approved)
**Approved by**: user @ 2026-09-17
**Grounded in**: recon.md

---

## Chosen Approach

Introduce a `commandStack` service in `@d3-polytree/core` that gives the engine transactional
undo/redo, and reroute **all** model mutation through registered command handlers. The design was
pressure-tested over three debate rounds (panel → adversary ×3); the router-purity claim that the
waypoint decision rests on was verified against code.

### The service and contract

- **`commandStackModule`** — a didi module contributing a `CommandStack` service, following the
  existing `*Module` provider pattern (`['type', Class]` + `__init__`/`__depends__`,
  recon.md `modelling/index.ts:19-60`), re-exported from `index.ts` alongside `CommandStack` and
  `CommandHandler`.
- **`CommandStack` API**: `execute(command, context)` / `undo()` / `redo()` / `canUndo()` /
  `canRedo()` / `clear()` / `registerHandler(name, handler)`. Internally an array + pointer;
  `execute` after `undo` truncates the redo tail. `canUndo()`/`canRedo()` are defined as
  `_enabled && stack has entries in that direction`.
- **`CommandHandler` contract**: `canExecute?` / `preExecute?` / `execute` / `revert` /
  `postExecute?`. **The context object is the memento** — `execute` captures prior values onto the
  context it is handed and `revert` restores them; no document clone, no snapshot store. Per O13
  (ROADMAP.md:536-539) a context holds **ids and plain model-prop values only** — never live
  element handles or D3 selections — so a future CRDT/collab adapter (C6) is an adapter, not a
  rewrite.
- **Transactions**: a top-level `execute` opens a transaction; any `execute` issued from a
  handler's `preExecute`/`postExecute` **joins** it; the whole transaction is **one** stack entry
  (one Ctrl+Z). `revert` walks the entry's commands in reverse.

### Reroute (`Modelling` becomes a registration site + notification subscriber)

The four modelling handlers become `CommandHandler`s registered against the vocabulary
`element.create` / `element.delete` / `element.move` / `element.resize` /
`element.updateProperties` / `link.create`. Their `execute`/`revert` **reuse the existing write
primitives** (recon.md Patterns to REUSE): `collections.add`/`collections.remove`
(`utils/collections.ts`) for create/its inverse, and the existing soft-delete `status` flag
(`ModellingElement.ts:64-84`) whose inverse is simply restoring the captured prior status.
`Modelling` stops routing events to mutations and becomes the registration site; its
`doAction` survives one minor as a deprecated shim (O12). Draw-layer `<class>.created`/`.deleted`
events **remain as pure notifications**, so the boot-order = subscription-order invariant
(CLAUDE.md:73) is untouched. Dispatchers become command dispatchers:
`Selection.deleteSelected` (recon.md `selection.ts:70`), `Drag` (`drag.ts:62`),
`ResizeElement`, and the palette add-handlers (`palette/BaseAddHandler.ts:48`,
`palette/AddLinkTool.ts:112`).

### The verified capture set (the fidelity crux)

Every mutating gesture writes only nested `pfdn:Coordinates` objects and serialized `isAttr`
scalars. The complete per-gesture serialized write set — exhaustively grepped in `features/` in
round 3 — is:

- **`element.move`** — `{ position, status }` for the **node AND its associated `pfdn:Label`**.
  Drag moves both node and label by the same `dx/dy` (recon.md `drag.ts:50-56`), writing
  `position.x/y` and flipping `status`→2 on each (`drag.ts:80-86`). The label is a separately
  serialized IDREF element reached via `node.label` (`Nodes.ts:71`), so its `position` **and**
  `status` must be captured and restored, and its drawing reconciled, on revert.
- **`element.resize`** — `{ position, size }` for the **node only**. Resize writes neither
  `status` nor the label (`resizeElement.ts:74-75,93,105`, gated to `pfdn:Node`).
- **`element.delete`** — soft-delete `status=3` on node + the cascaded `label.deleted`
  (`ModellingElement.ts:74-83`); the label's prior status is captured via the cascade.
- **`element.create`** — the inverse removes **both** the node and its auto-created associated
  label (`Nodes.ts:51-71`); both were persisted via `.created`→`saveToModel`.
- Other `features/` prop writes found are **non-serialized transient state** (zoom offset
  `zoom.ts:89`, alert badge struct `alertIcons.ts:139`, the fake-link preview `AddLinkTool.ts:105`)
  and do not round-trip through `toXML` — no command needed.

### Links: replay-based waypoint revert (Option B)

Commands **never write `link.waypoint`**. The live `node.moved`/`node.updated → updateNodeLinks`
subscription (recon.md `Links.ts:83-84`) stays the **sole** waypoint writer. On revert, the move
command restores node positions and reconciles the node drawing; `reconcile` emits `<class>.updated`
(`draw/BaseElement.ts:131`), and because `updateNodeLinks` subscribes to **both** `node.moved` and
`node.updated`, the router recomputes every incident link's waypoints from the restored positions.
This is sound because the router is a **pure, recomputed** function of model position/size —
verified in rounds 2–3: `_setSideConnectors` allocates a fresh `sides` each call (`Links.ts:231`)
and overwrites it (`:263`), `link.waypoint` is fully reassigned each `_updateLink` (`:348`), and
`_routing` is a scratch cache (no history accumulation). So a replay from restored positions is
byte-identical to the pre-move array, which is why no waypoint needs to live in the memento — and
this dissolves the shared-incident-link double-capture problem entirely.

### Render channel, failure semantics, boot latch

- **One render channel**: each `execute`/`revert` reconciles its own touched set (matching the
  existing self-reconcile convention, `ModellingElement.ts:83`, `Links.ts:107,349`). The stack
  emits **no** `elements.changed` event — a second channel would reintroduce the O11 double/missed
  render at the draw layer. Transaction-level invariant: **all model position/status/size writes
  precede any reconcile/emit**, batched across the whole selection, so a shared link never reroutes
  against a half-restored endpoint.
- **Failure semantics**: an exception in `execute` best-effort reverts the commands already applied
  in the transaction and rethrows; the entry is never pushed. If a `revert` itself throws, the
  stack **best-effort continues** reverting the rest, then **quarantines the whole stack**
  (disable the `_enabled` latch + clear both stacks → `canUndo()`/`canRedo()` both false) and emits
  a fatal `document.inconsistent` event, rethrowing an aggregated error — never the silent
  half-mutated state ROADMAP.md:552-554 forbids.
- **Boot latch**: the stack is disabled until `d3canvas.init`. Verified: drawers render and their
  `saveToModel` run synchronously inside `createInjector` (`Diagram.ts:64`) and `d3canvas.init` is
  emitted after (`:65`), so the boot round-trip cannot enter the stack — `canUndo()===false`
  immediately after `importDiagram` is genuinely guaranteed and test-guarded. The same `_enabled`
  latch is reused for quarantine.

### Totality enforcement and rollout

- **Totality is gated on a gesture-level `toXML` round-trip harness** (authoritative): snapshot
  `moddle.toXML()` → drive the real dispatcher for a gesture → `undo()` → assert `toXML` returns to
  the snapshot. An escaped write leaves residue surviving undo → `toXML` diff → red CI. An eslint
  `no-restricted-syntax` rule banning the _named, matchable_ primitives (`collections.add/remove`,
  moddle `.set(`) outside a handler-dir glob is a **cheap tripwire only** — it cannot be the proof,
  because bare type-erased assignments (`(def.position as Point).x =`, `definition.size =`) are
  unmatchable by lint (this corrects the RFC's `definitions.*` lint premise, which matched none of
  the real write sites).
- **Two-PR rollout**: **PR-1** is core-only and net-green — `commandStackModule` + handlers + the
  `toXML` harness + the boot latch + the eslint tripwire; reroute one dispatcher at a time
  (create → delete → resize → move) each behind the harness; every existing test stays green
  step-by-step. **PR-2** exposes the component surface — `undo()`/`redo()` + a `document.changed`
  dirty flag (off the stack pointer) via `get('commandStack')`, and greenfield Ctrl+Z/Ctrl+Shift+Z
  keydown binding in `interactive-viewer`/`editor` — only after PR-1's tripwire is green.

## Rejected Alternatives

- **Keep `Modelling` as the event→mutation router; wrap existing handler methods without a
  `CommandHandler` contract (minimal-delta panel proposal)** — rejected: it left `create` as a
  notification-persist _outside_ `commandStack.execute`, contradicting decided O11 (full reroute)
  and re-opening the two-path desync O11 exists to prevent. Its primitive-reuse insight was kept,
  inside the full contract.
- **Recompute link waypoints on revert by re-emitting `node.moved`, storing nothing (minimal-delta
  fork b)** — initially rejected as "not byte-identical," then re-examined: the router _is_ pure, so
  this became the winning mechanism (Option B). The variant that also _stored_ the prior array
  (target-state/operational-safety) was rejected as redundant once purity was proven.
- **Store the prior waypoint array in the move command's memento** — rejected: redundant given a
  pure recomputed router, and it created a two-writer race (stored array vs live reroute) plus a
  shared-incident-link double-capture bug that replay avoids entirely.
- **A stack-level `elements.changed` render event** — rejected: a second render channel alongside
  the existing per-handler `reconcile`, causing double/missed renders (the O11 problem at the draw
  layer).
- **An eslint rule keyed on `definitions.*` as the totality proof (RFC §12 wording)** — rejected:
  matches none of the real write sites (`collections.*`, `.set(`, bare type-erased assignments);
  demoted to a tripwire, with the `toXML` harness as the proof.
- **Single-PR big-bang reroute** — rejected for the two-PR staging so CI stays green step-by-step
  (CLAUDE.md:34) and the reroute's totality is proven before the component API is exposed.
- **`element.move` command owns the reroute; drop the live `node.moved` subscription (Option A)** —
  not chosen: unnecessary given proven router purity, and it would lose live mid-drag link
  rerouting. Retained as the documented fallback if the router ever stops being pure.

## Open Risks

- [ ] **Router-purity precondition — "all incident nodes are drawn at revert time."**
      `_setSideConnectors` early-returns leaving stale `sides` if a node's drawing is absent
      (`Links.ts:233-235`). Replay-revert satisfies this (it never deletes nodes; delete-revert
      restores `status` and reconciles the node back into the drawing before any incident-link reroute).
      — to be **asserted in the harness** (a both-endpoints-selected multi-move fixture) and stated as a
      code comment on the move handler.
- [ ] **Transaction-level write-before-reconcile batching.** For a multi-node selection move, the
      move command must restore **all** node+label positions/statuses before reconciling **any** drawing,
      and the harness must assert `toXML` only at transaction boundaries. — to be addressed at the
      move-handler plan step + its harness fixture.
- [ ] **Router remaining pure over model state.** Option B's correctness depends on the waypoint
      computation staying a pure function of model position/size. — the both-endpoints harness fixture is
      the standing guard; if a future change makes routing stateful, fall back to Option A.
- [ ] **`document.changed` debounce semantics** (derived from `canUndo()` transitions past the boot
      latch). — a PR-2 detail.

## Principles & Host Rules Touched

- `DN-2` (reuse over rebuild) — honored by: execute/revert reuse `collections.add/remove` and the
  soft-delete `status` flag; waypoints reuse the existing pure router; render reuses `reconcile`.
- `DN-7` (YAGNI) — honored by: no stored waypoint memento (router is pure), no typed command surface
  now (deferred to C12), no `elements.changed` event; each mechanism tied to a concrete current
  requirement.
- `DN-8` (SOLID at real seams) — honored by: `CommandHandler` is the one new seam; `Modelling`
  keeps a single responsibility (registration + notification); dispatchers depend on the stable
  `commandStack.execute` seam.
- `DN-9` (staff-engineer check) — honored by: fidelity (byte-identical `toXML`) and the no-desync
  invariant were held above pattern-purity throughout; Option B chosen on measured router behavior,
  not dogma.
- `O11` (full reroute) — honored by: the `toXML` harness enforces that no serialized write escapes a
  command; the eslint tripwire is defense-in-depth.
- `O12` (pre-1.0 breaking OK) — honored by: `doAction`/`ModellingElement` change behind a one-minor
  deprecated shim.
- `O13` (serializable contexts) — honored by: contexts hold ids + plain model-prop values only.
- Host hard rule "**Boot order = event-subscription order.**" (`CLAUDE.md:73`) — honored by: draw-layer
  `.created`/`.deleted` stay notifications; `Modelling` keeps its subscriptions in the same order;
  the stack registers without reordering core modules.
- Host hard rule "Moving a created-listener after the drawers silently drops the initial elements…"
  (`CLAUDE.md:76`) — honored by: no created-listener is moved; the folded-panel ordering tests must
  still pass (a plan verification step).
- Host hard rule "**jsdom shims are intentional…**" (`CLAUDE.md:93`) — honored by: every captured
  value is read from moddle model props, never `getBBox`/`outline.attr`, so the zero-box shim never
  contaminates a memento and the harness is valid in CI and a real browser alike.
- Host hard rule "CI … runs exactly: install (frozen) → lint → typecheck → test → build →
  build-storybook." (`CLAUDE.md:34`) — honored by: the harness runs in the `test` phase; the eslint
  tripwire in `lint`; nothing added to the CI order.

## Waivers

None. All norm objections raised across the three rounds were addressed in the design; no `DN-*`
objection was waived.
