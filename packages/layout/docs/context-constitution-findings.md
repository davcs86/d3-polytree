# @d3-polytree/layout — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say | What the code does | Evidence | Suggested action |
|---|---|---|---|
| README section order / has an API table | README order (`## Solver` / `## Running off the main thread` / `## In the editor`) doesn't follow the repo's mandated template (`docs/README-template.md`), and ships no feature/API table | `packages/layout/README.md`, `docs/README-template.md` | Restructure README to the template |

## Latent bugs (looks broken, not merely non-obvious)

| Issue | Impact | Evidence |
|---|---|---|
| `resolveOptions` applies defaults but never clamps/validates | a negative `nodeSpacing` or `orderIterations: 0` flows straight into the solver | `packages/layout/src/types.ts#resolveOptions` |
| `WorkerLayoutRunner.run` never rejects/times out | a worker error/crash leaves the promise pending forever | `packages/layout/src/runner.ts#WorkerLayoutRunner` |

## Dead / orphaned code

_None._

## Open questions (unresolved *why* — needs a maintainer)

- Are the magic constants tuned or arbitrary: dummy coordinate weight **128** (`coordinates.ts#placeLayer`) and the crossing-transpose fixpoint bound **`guard < 8`** (`order.ts#reduceCrossings`)? Does `guard < 8` ever cap quality on large graphs? — status: **open**
- `package.json` sets `"sideEffects": false` yet `worker.ts` is a top-level side-effect module (`self.onmessage = …`) — is the `./worker` entry safe from tree-shaking across all target bundlers? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
