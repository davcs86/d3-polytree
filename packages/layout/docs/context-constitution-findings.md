# @d3-polytree/layout — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None open._

## Latent bugs (looks broken, not merely non-obvious)

_None open._

## Dead / orphaned code

_None._

## Open questions (unresolved *why* — needs a maintainer)

- Are the magic constants tuned or arbitrary: dummy coordinate weight **128** (`coordinates.ts#placeLayer`) and the crossing-transpose fixpoint bound **`guard < 8`** (`order.ts#reduceCrossings`)? Does `guard < 8` ever cap quality on large graphs? — status: **open**
- `package.json` sets `"sideEffects": false` yet `worker.ts` is a top-level side-effect module (`self.onmessage = …`) — is the `./worker` entry safe from tree-shaking across all target bundlers? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue | Evidence (was) | Resolved | How confirmed |
|---|---|---|---|
| README didn't follow the shared template | `packages/layout/README.md` | 2026-09-23 | Restructured to the template (Install → feature table → Usage → API → where-it-fits) |
| `resolveOptions` never clamped/validated | `packages/layout/src/types.ts#resolveOptions` | 2026-09-23 | Clamps spacing/margin to non-negative finite, iteration counts to non-negative integers |
| `WorkerLayoutRunner.run` never rejected/timed out | `packages/layout/src/runner.ts#WorkerLayoutRunner` | 2026-09-23 | Added a `timeoutMs` (default 30000) that rejects a hung/crashed worker |

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
