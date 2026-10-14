# Archive — RFC: CommandStack (C1 / phase B10)

> **Archived from [`ROADMAP.md`](../../ROADMAP.md)** (as of `main` @ `c931aa8`, 2026-10-14). Implemented and released (C1 ✅). The spec is kept whole for the design rationale; the **unmet exit criteria** are carried into `ROADMAP.md` §11.1 (C1 follow-ups).
> Text under a **From §N** heading is moved **verbatim** — original `§`/`B*`/`C*`/`H*`/`G*` ids are
> unchanged, so existing references keep resolving through the stubs left in `ROADMAP.md`. The only
> new prose is under **Archive-time verification**, which records how completion was checked.

## 12. RFC — CommandStack (C1 / phase B10)

> Decided: **O11** (full reroute), **O12** (pre-1.0 breaking changes accepted), **O13** (serializable
> contexts, collaboration deferred).

### 12.1 Problem

Model mutation today is a side effect of a notification:

- `Modelling._init()` subscribes to `label|link|node|zone.created` / `.deleted` and `element.updated`,
  and dispatches straight into `saveToModel` / `delete` / `reconcile` on the matching handler.
- `Selection.deleteSelected()` iterates the selection and emits one `.deleted` per entry.
- `Drag`, `ResizeElement`, and the palette add-handlers all mutate through that same path.

Four consequences follow directly, and none is fixable without a mutation primitive:

1. **No undo/redo.** Nothing captures what changed, so nothing can invert it.
2. **No atomicity.** Deleting a multi-selection is N independent mutations (H2). A throw partway
   through leaves the document torn, with no rollback and no record of how far it got.
3. **No dirty tracking.** `localStorage` autosave and `exporting` cannot tell a modified document
   from an untouched one, so neither can offer an unsaved-changes guard.
4. **No op stream.** Auto-layout (C3), diff-apply (C5), and collaboration (C6) each need to apply a
   batch of changes as one reversible unit. Without this, each invents its own half-solution.

### 12.2 Design

**Service.** `commandStack` (type `CommandStack`), contributed by `commandStackModule`:

```ts
execute(command: string, context: CommandContext): void;
undo(): void;
redo(): void;
canUndo(): boolean;
canRedo(): boolean;
clear(): void;
registerHandler(command: string, handler: Constructor<CommandHandler>): void;
```

**Handler contract.** Handlers are didi-resolvable types registered against a command name:

```ts
interface CommandHandler<C extends CommandContext = CommandContext> {
  canExecute?(context: C): boolean;
  preExecute?(context: C): void; // may execute() sub-commands into this transaction
  execute(context: C): DirtyElements;
  revert(context: C): DirtyElements; // the exact inverse of execute
  postExecute?(context: C): void;
}
```

The **context object is the memento**: `execute` captures prior values onto the same context it was
handed, and `revert` restores from them. There is no separate snapshot store, and no structural clone
of the document. Per O13, a context holds ids and plain values only — never live element handles or
D3 selections — so it stays serializable for a future collaboration adapter.

`DirtyElements` is the set of model elements a command touched. The stack emits it as
`elements.changed`, and the draw layer reconciles exactly those — replacing today's implicit coupling
where a drawer already having rendered is what keeps the view in sync.

**Transactions.** A top-level `execute()` opens a transaction; any `execute()` issued from within
`preExecute`/`postExecute` joins it rather than opening its own. On close the whole transaction is
pushed as **one** stack entry, so a multi-select delete or a full auto-layout run is a single Ctrl+Z.
`revert` walks that entry's commands in reverse order.

**Redo.** The stack is a pointer into an array. `execute` after `undo` truncates the redo tail.

**Failure semantics (the fault-tolerance argument).** An exception inside `execute` reverts the
commands already applied in that transaction, discards the entry, and rethrows. The document is
never left half-mutated, and the stack never records a transaction that did not fully apply.

**Command vocabulary (v1 set).** `element.create`, `element.delete`, `element.move`,
`element.resize`, `element.updateProperties`, `link.create`, `link.reconnect`,
`link.updateWaypoints`, and composites such as `elements.align` that fan out in `preExecute`.

### 12.3 Rerouting

- The four modelling handlers (`modellingNodes` / `Labels` / `Zones` / `Links`) are refactored into
  `CommandHandler` implementations registered against the vocabulary above.
- `Modelling` stops being an event→mutation router and becomes the registration site plus a thin
  façade; `doAction` survives as a deprecated shim for one minor, then is removed (O12).
- Draw-layer `<class>.created` / `.deleted` events **remain**, as notifications only. The boot-order
  invariant documented in `CLAUDE.md` — features that must observe the initial render register ahead
  of the drawers — is unchanged and still load-bearing.
- `Drag`, `ResizeElement`, `Selection.deleteSelected`, and the palette add-handlers become command
  _dispatchers_.

**Boot-time hazard — the riskiest detail in this RFC.** The initial render currently round-trips every
loaded element through `saveToModel`. Once mutation is command-driven, the boot render must not enter
the stack, or every opened document starts with N undoable entries and `canUndo()` true on an
untouched file. Mitigation: the stack stays disabled until boot completes, and a test asserts
`canUndo() === false` immediately after `importDiagram`.

### 12.4 Public API impact (breaking, accepted under O12)

- `Modelling.doAction(cls, action, params)` → deprecated shim, removed before 1.0.
- `ModellingElement` gains the handler shape; `saveToModel` / `delete` / `reconcile` are re-expressed
  in terms of it.
- New exports from `@d3-polytree/core`: `commandStackModule`, `CommandStack`, `CommandHandler`,
  and the command-context types.
- `Viewer` subclasses gain `undo()` / `redo()` and a `document.changed` event carrying a dirty flag.
- Shipped as a Changesets **minor** across `core` and the three components, with a migration note.

### 12.5 Testing

- **Round-trip property test, per handler.** For each fixture document and each command,
  `execute → revert` must restore a byte-identical `moddle.toXML()`. This single invariant is the
  whole safety net, and it is mechanically checkable across the entire vocabulary.
- **Transaction tests.** A multi-select delete produces exactly one stack entry; a handler that
  throws mid-transaction leaves the document and the stack unchanged.
- **Boot test.** `importDiagram` leaves `canUndo() === false` (§12.3).
- **Ordering test.** The existing folded-panel guards must still pass — proof that turning the
  created/deleted events into pure notifications did not disturb the boot-order invariant.

### 12.6 Exit criteria

- Every model mutation in the workspace flows through `commandStack.execute`, enforced by a lint rule
  banning direct writes to `definitions.*` outside a registered handler.
- `execute`/`revert` round-trips are XML-identical for every command in the v1 vocabulary.
- Ctrl+Z / Ctrl+Shift+Z wired in `interactive-viewer`; undo/redo palette entries in `editor`.
- `document.changed` drives `localStorage` autosave and an unsaved-changes guard.
- Storybook story demonstrating atomic multi-select delete and undo of an auto-layout run.

## Archive-time verification of §12.6 exit criteria (2026-10-14)

| Exit criterion                                                                 | State          | Evidence                                                                                                                                                                                         |
| ------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Every mutation flows through `commandStack.execute`; round-trips XML-identical | ✅             | `core/src/command/`, `editor/src/command.roundtrip.test.ts`; palette add-handlers route via the stack (`BaseAddHandler.ts:37`)                                                                   |
| …"enforced by a lint rule banning direct writes to `definitions.*`"            | ❌ not present | no such rule in `eslint.config.js`; `docs/design/ledger.md` (2026-09-17) records that a token lint rule cannot prove mutation totality and the `toXML` round-trip test is the authoritative gate |
| Ctrl+Z / Ctrl+Shift+Z wired                                                    | ◐              | wired in **`editor`** (`editor/src/index.ts`, scoped to the editor container), not `interactive-viewer`                                                                                          |
| Undo/redo palette entries in `editor`                                          | ❌ not found   | no undo/redo entry in `core/src/features/palette/PaletteProvider.ts` (API-only: `undo()/redo()/canUndo()/canRedo()`)                                                                             |
| `document.changed` drives `localStorage` autosave and an unsaved-changes guard | ❌ not found   | `features/localStorage.ts` does not subscribe to it; only `element` consumes `document.changed` (no `beforeunload`/guard in `packages/*/src`)                                                    |
| Storybook story: atomic multi-select delete + undo of an auto-layout run       | ✅             | `InteractionHarness.stories.ts`, `AutoLayout.stories.ts`                                                                                                                                         |
| `Modelling.doAction` deprecated shim removed before 1.0 (O12)                  | ⏳ pending     | still present at `core/src/modelling/Modelling.ts:75`; packages are `0.x`                                                                                                                        |
