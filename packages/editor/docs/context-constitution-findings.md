# @d3-polytree/editor — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None open._

## Latent bugs (looks broken, not merely non-obvious)

_None open._

## Dead / orphaned code

| What                                                                                           | Why it looks dead          | Evidence                                                           |
| ---------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------ |
| `EntryFactory.spreadsheet` is an API-compatible **no-op** ("Placeholder in the source engine") | may be dead public surface | `packages/editor/src/properties-panel/EntryFactory.ts#spreadsheet` |

## Open questions (unresolved _why_ — needs a maintainer)

- Should a text edit coalesce into one undo step rather than one-per-idle-gap-keystroke (300ms debounce)? — status: **open**
- Is the `spreadsheet` entry type still supported public API, or removable? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue                                                      | Evidence (was)                                | Resolved   | How confirmed                                                                                       |
| ------------------------------------------------------------------------------ | --------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| tsup `external` omitted `@d3-polytree/interactive-viewer` → inlined the parent | `packages/editor/tsup.config.ts#external`     | 2026-09-23 | Added `@d3-polytree/interactive-viewer` to the library-pass `external` (+ patch changeset)          |
| CLAUDE.md: `editor/style.css` = properties panel only                          | `packages/editor/src/style.scss`              | 2026-09-23 | Corrected to note it aggregates panel + palette + drag + iv tokens; build compiles `src/style.scss` |
| CLAUDE.md `editionModules` list omitted autoLayout + the 3 panel modules       | `packages/editor/src/index.ts#editionModules` | 2026-09-23 | Updated the list                                                                                    |
| README API table omitted `setLinkPinned`/`canUndo`/`canRedo`                   | `packages/editor/README.md#API`               | 2026-09-23 | Added the three rows                                                                                |

---

_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
