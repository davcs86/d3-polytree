# @d3-polytree/element — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None._

## Latent bugs (looks broken, not merely non-obvious)

_None._

## Dead / orphaned code

_None open._

## Open questions (unresolved *why* — needs a maintainer)

_None._

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue | Evidence (was) | Resolved | How confirmed |
|---|---|---|---|
| Unused direct `@d3-polytree/viewer` dependency | `packages/element/package.json` | 2026-09-23 | Removed (verified: not imported by `src/`, absent from the built `dist/index.d.ts`, and `generate-styles` reads only editor + interactive-viewer CSS) |
| `exportSVG()` not idempotent across repeated calls | `packages/element/src/index.ts#exportSVG` | 2026-09-23 | Fixed at the root in `@d3-polytree/canvas` `getSvgString` (serialize a clone, never the live node) — repeated exports no longer accumulate `<style>`/attrs, for element, viewer, and ssr alike |

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
