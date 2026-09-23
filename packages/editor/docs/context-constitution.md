# @d3-polytree/editor — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the editing
layer + folded properties panel. Does not restate the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/editor**.

## Rules (`EDITOR-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **EDITOR-01** | `element.updateProperties` is the **one** command handler owned by the editor (the properties panel injects it onto the shared `commandStack` at construction). All other verbs (`element.create/move/resize/delete`, `link.pin`) are registered by **core** modelling. | Adding a property-edit command to core's orchestrator would never fire (the panel supplies the `scope`/`updateDrawing` closure), or would double-register and clobber the panel's handler. | `packages/editor/src/properties-panel/PropertiesPanel.ts#_registerUpdatePropertiesCommand`, `#_commit` | `packages/editor/src/properties-panel/PropertiesPanel.ts#_registerUpdatePropertiesCommand` |
| **EDITOR-02** | Panel model access is **dotted-path via `deepGet`/`deepSet`**, never direct member access, so nested moddle objects (`label.text`, `grid.size`) are addressed uniformly. | A `set` that assigns straight to the property skips the intermediate-object creation `deepSet` does and **breaks undo capture** (the `{before}`/`{after}` is minted off the same path). | `packages/editor/src/properties-panel/utils.ts#deepGet`, `#deepSet`, `packages/editor/src/properties-panel/PropertiesPanel.ts#_commit` | `packages/editor/src/properties-panel/utils.ts#deepSet` |
| **EDITOR-03** | `getModules()` inserts a third tier, `editionModules`, **between** `interactionModules` and the drawers. A new editor feature that must see initial elements goes there (before drawers); an override module still goes last (`PLAT-01`). | Placing a created-listener after the drawers silently drops the initial model. | `packages/editor/src/index.ts#getModules`, `#editionModules` | `packages/editor/src/index.ts#getModules` |

## Norms (`EDITOR-*`) — defaults & asymmetry guidance

| ID | Norm | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **EDITOR-N04** | Editor SCSS `@import`s interactive-viewer's **source** `_tokens` (`../../interactive-viewer/src/tokens`), not its `dist`, at build time. | Renaming/moving `interactive-viewer/src/_tokens.scss` breaks the editor build. | `packages/editor/src/style.scss` | `packages/editor/src/style.scss` |

## Gotchas & scars

- **Editor consumers must import BOTH `interactive-viewer/style.css` and `editor/style.css`** — the editor's own `style.css` aggregates properties-panel + palette + drag + iv tokens. Scar lineage PR #69 (palette/drag CSS shipped so the toolbar renders).
- **A plain node click must not commit a zero-delta move or a no-op undo step, nor clear its own selection.** Scars `dc6b3df` / `32d713d` / `aea734a` — keep `beginDrag`/`endDrag` gated on an actual delta.

## Candidate rules (unverified)

| Candidate | Why suspected | What would confirm it |
|---|---|---|
| Text-input edits should coalesce into one undo step | `_registerInputChangeHandlers` debounces text `input` at 300ms but commits `select`/`change` immediately, so each idle-gap keystroke becomes a **separate** undo entry | maintainer confirms intended granularity |

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| Properties panel decoupled from side-tabs via structural `SideTabsRegistrar` | `packages/editor/CLAUDE.md`, root `IV-01` |
| Editor consumers import both `interactive-viewer/style.css` and `editor/style.css` | `packages/editor/CLAUDE.md`, `README.md#Styling` |
| `getModules()` order + domNotifications-last | root `CLAUDE.md`, root `PLAT-01` |
| B10 create/delete route through `commandStack` (draw-layer `.created` no longer persists) | `packages/editor/src/index.ts#createNode`; `command.roundtrip.test.ts` |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
