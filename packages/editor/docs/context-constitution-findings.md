# @d3-polytree/editor — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say | What the code does | Evidence | Suggested action |
|---|---|---|---|
| `packages/editor/CLAUDE.md` + root: `editor/style.css` = the properties panel only | `build` compiles `src/style.scss`, which aggregates properties-panel **+ palette + drag + interactive-viewer tokens** | `packages/editor/package.json#scripts`, `packages/editor/src/style.scss` | Correct both CLAUDE.md lines |
| `packages/editor/CLAUDE.md` lists `editionModules` = drag, modelling, exporting, localStorage, upload, palette, resizeElement | code also adds `autoLayoutModule` + the three properties-panel modules | `packages/editor/src/index.ts#editionModules` | Update the CLAUDE.md list |
| README API table + "provide a `layoutRunner` DI value" | README omits `setLinkPinned`, `canUndo`, `canRedo`; the editor resolves the `autoLayout` token (the `layoutRunner` token lives in core — possibly stale name) | `packages/editor/src/index.ts#setLinkPinned`, `#autoLayout`, `packages/editor/README.md#API` | Fix the README API table + token name |

## Latent bugs (looks broken, not merely non-obvious)

| Issue | Impact | Evidence |
|---|---|---|
| `tsup.config.ts` library-pass `external` **omits `@d3-polytree/interactive-viewer`** (its direct parent), though it lists viewer/core/canvas/pfdn-moddle/d3-selection | the editor's ESM/CJS build inlines all of interactive-viewer → bloat + a duplicate engine for consumers who dedupe workspace deps (violates `PLAT-05`) | `packages/editor/tsup.config.ts#external` |

## Dead / orphaned code

| What | Why it looks dead | Evidence |
|---|---|---|
| `EntryFactory.spreadsheet` is an API-compatible **no-op** ("Placeholder in the source engine") | may be dead public surface | `packages/editor/src/properties-panel/EntryFactory.ts#spreadsheet` |

## Open questions (unresolved *why* — needs a maintainer)

- Should a text edit coalesce into one undo step rather than one-per-idle-gap-keystroke (300ms debounce)? — status: **open**
- Is the `spreadsheet` entry type still supported public API, or removable? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
