# @d3-polytree/viewer — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None open._ (the broader "should terminal components declare core's D3 peers?" packaging question is tracked at the root as an open question / candidate.)

## Latent bugs (looks broken, not merely non-obvious)

_None._

## Dead / orphaned code

_None open._

## Open questions (unresolved _why_ — needs a maintainer)

- Is the component `external` list (duplicate + never-imported `d3-selection`) intentional defensive boilerplate or prunable to just `@d3-polytree/core`? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue                                                   | Evidence (was)                            | Resolved   | How confirmed                                                                                |
| --------------------------------------------------------------------------- | ----------------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `eventemitter3` shipped as a runtime `dependency` (used only `import type`) | `packages/viewer/package.json`            | 2026-09-23 | Moved to `devDependencies` (+ patch changeset)                                               |
| tsup `external` listed `@d3-polytree/core` twice                            | `packages/viewer/tsup.config.ts#external` | 2026-09-23 | Removed the duplicate (the full-chain entries match the repo convention, kept)               |
| README "six D3 slices are peer dependencies" of viewer                      | `packages/viewer/README.md#Install`       | 2026-09-23 | No change needed — the README already qualifies "(inherited from `core`)", which is accurate |

---

_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
