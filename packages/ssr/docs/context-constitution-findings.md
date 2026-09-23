# @d3-polytree/ssr — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None open._

## Latent bugs (looks broken, not merely non-obvious)

_None._

## Dead / orphaned code

_None._

## Open questions (unresolved _why_ — needs a maintainer)

- Is single-module-instance serialization (the module-level promise chain) the intended isolation boundary, or should install/render be worker-isolated? A second module copy or other code writing `globalThis.document` is unguarded. — status: **open**
- `installDom` add-only skip carries a "design open risk": if a future Node exposes a DOM global as a non-DOM value, add-only silently keeps Node's. Defer, or add the force-override set now? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue   | Evidence (was)                         | Resolved   | How confirmed                                                                                                   |
| --------------------------- | -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| README: "Bundles … `jsdom`" | `packages/ssr/tsup.config.ts#external` | 2026-09-23 | README fixed: `jsdom` is a regular runtime dep (external at build); only the `@d3-polytree/*` engine is bundled |

---

_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
