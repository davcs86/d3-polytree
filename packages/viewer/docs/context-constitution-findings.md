# @d3-polytree/viewer — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say | What the code does | Evidence | Suggested action |
|---|---|---|---|
| README: "The six D3 v7 slices are **peer dependencies**" of `@d3-polytree/viewer` | `packages/viewer/package.json` declares **no** `peerDependencies` (the peers live on `@d3-polytree/core`) — npm consumers of viewer get no peer-dep warning | `packages/viewer/README.md#Install`, `packages/viewer/package.json` | Declare the peers, or correct the README to say they arrive via core |

## Latent bugs (looks broken, not merely non-obvious)

_None._

## Dead / orphaned code

| What | Why it looks dead | Evidence |
|---|---|---|
| `eventemitter3` is a runtime `dependency` but used only via `import type` (erased at compile) | ships an unused runtime dep edge; belongs in `devDependencies` | `packages/viewer/package.json`, `packages/viewer/src/index.ts` |
| `tsup.config.ts` `external` lists `@d3-polytree/core` **twice** and externalizes `@d3-polytree/canvas`, `@d3-polytree/pfdn-moddle`, `d3-selection` — none imported by viewer's src | inert duplicate + never-imported entries | `packages/viewer/tsup.config.ts#external` |

## Open questions (unresolved *why* — needs a maintainer)

- Is the component `external` list (duplicate + never-imported `d3-selection`) intentional defensive boilerplate or prunable to just `@d3-polytree/core`? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
