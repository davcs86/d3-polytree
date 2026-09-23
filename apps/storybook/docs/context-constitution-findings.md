# @d3-polytree/storybook — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None open._

## Latent bugs (looks broken, not merely non-obvious)

| Issue | Impact | Evidence |
|---|---|---|
| A pointer click "also commits a zero-delta `element.move`" (command-hygiene defect, flagged in the spec) | pollutes the undo stack on a selection-only click (same root cause as core scars `dc6b3df`/`aea734a`) | `apps/storybook/playwright/interactions.spec.ts` |

## Dead / orphaned code

_None._

## Open questions (unresolved *why* — needs a maintainer)

- `Kitchensink.stories.ts` writes `new Date().toLocaleTimeString()` into a VR-captured activity log — tolerated only because `maxDiffPixelRatio: 0.02` absorbs the timestamp text, or should the log be masked/excluded from VR? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue | Evidence (was) | Resolved | How confirmed |
|---|---|---|---|
| `AutoLayout.stories.ts` comment implied a direct `@d3-polytree/layout` dep | `apps/storybook/src/AutoLayout.stories.ts` | 2026-09-23 | Comment clarified: the layout solver is reached via `core`/`editor`, not a direct Storybook dependency |

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
