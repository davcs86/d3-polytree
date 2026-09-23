# @d3-polytree/ssr — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say | What the code does | Evidence | Suggested action |
|---|---|---|---|
| README: the package "Bundles … `jsdom`" | `jsdom` is `external` in tsup and a plain `dependencies` entry (`jsdom: 25.0.1`) — installed transitively, not bundled into `dist` | `packages/ssr/README.md#Install`, `packages/ssr/tsup.config.ts#external` | Correct the README wording; also add the template feature/API table |

## Latent bugs (looks broken, not merely non-obvious)

_None._

## Dead / orphaned code

_None._

## Open questions (unresolved *why* — needs a maintainer)

- Is single-module-instance serialization (the module-level promise chain) the intended isolation boundary, or should install/render be worker-isolated? A second module copy or other code writing `globalThis.document` is unguarded. — status: **open**
- `installDom` add-only skip carries a "design open risk": if a future Node exposes a DOM global as a non-DOM value, add-only silently keeps Node's. Defer, or add the force-override set now? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
