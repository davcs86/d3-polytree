# @d3-polytree/viewer — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the base
component subclasses extend — reboot mechanics and the event-rebind surface. Does not restate the docs
or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/viewer**.

## Rules (`VIEWER-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **VIEWER-01** | Reboot (`importDiagram`/`createEmpty`) routes through the **private, non-virtual `_teardown()`**, not the virtual `destroy()` — so subclass DOM bindings (e.g. the editor's undo/redo keydown listener) survive a reboot. Only a full teardown calls `destroy()`. | A subclass that puts binding-recreation only in a `destroy()` override survives today; a refactor that reroutes reboot through `destroy()` (the intuitive choice) silently strips those bindings. | `packages/viewer/src/index.ts#_teardown`, `packages/viewer/src/index.ts#_boot`, `packages/viewer/src/index.ts#destroy`; `packages/viewer/CHANGELOG.md#0.2.0` | `packages/viewer/src/index.ts#_teardown` |
| **VIEWER-02** | `viewer.on(...)` re-attaches **only** the three `ReboundEvent`s (`document.changed`, `selection.changed`, `commandStack.changed`) across a reboot; the `*.created` boot storm fires synchronously inside `new Diagram` **before** the bus is bound and is unreachable through `on()`. To see initial elements, inject a **module** registered before the drawers. | A caller relying on `viewer.on('node.created', …)` to catch initial elements gets nothing (and silently loses handlers for non-rebound events across a reboot). | `packages/viewer/src/index.ts#ReboundEvent`, `packages/viewer/src/index.ts#_boot` (re-attach loop), `packages/viewer/src/onoff.test.ts` | `packages/viewer/src/index.ts#ReboundEvent` |

## Norms (`VIEWER-*`) — defaults & asymmetry guidance

_None._

## Gotchas & scars

_None recovered._

## Candidate rules (unverified)

_None._

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| Subclasses override `getModules()`, not `_boot` (the single extension seam) | `packages/viewer/CLAUDE.md` |
| UMD second tsup pass, global `d3PolytreeViewer`, `clean` on first pass only | `packages/viewer/tsup.config.ts` header, `packages/viewer/CLAUDE.md` |
| didi last-wins + boot-order = subscription order | root `CLAUDE.md`, root `PLAT-02`/`PLAT-03` |
| Public API surface (`importDiagram`/`createEmpty`/`exportDiagram`/`exportSVG`/`get`/`on`/`off`/`destroy`) | `packages/viewer/README.md#API` |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
