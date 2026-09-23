# @d3-polytree/element — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None._

## Latent bugs (looks broken, not merely non-obvious)

_None._

## Dead / orphaned code

| What | Why it looks dead | Evidence |
|---|---|---|
| `@d3-polytree/viewer` is a direct `dependencies` entry but never imported by `src/` (only `@d3-polytree/editor` is) | candidate unused direct dependency (may be needed for `.d.ts` type resolution) | `packages/element/package.json`, `packages/element/src/index.ts` |

## Open questions (unresolved *why* — needs a maintainer)

- Is repeated `exportSVG()` on the same mounted element meant to accumulate `<style>`/attribute stamps, or should it clone/snapshot before stamping? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
