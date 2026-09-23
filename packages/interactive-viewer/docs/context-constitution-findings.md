# @d3-polytree/interactive-viewer — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

> ⚠ **security** — the top row touches an HTML-injection surface; treat it first.

## Documentation that lies (docs claim behavior the code lacks)

_None._

## Latent bugs (looks broken, not merely non-obvious)

| Issue | Impact | Evidence |
|---|---|---|
| ⚠ `DomNotifications._fillText` uses `el.innerHTML` when `params.html` is set (comment: "trusted, in-repo callers only") | an XSS surface if any caller ever routes untrusted/model-derived text through `notify(..., { html: true })` | `packages/interactive-viewer/src/notifications/DomNotifications.ts#_fillText` |

## Dead / orphaned code

_None._

## Open questions (unresolved *why* — needs a maintainer)

- Confirm no caller routes untrusted/model-derived content through `notify(..., { html: true })`; if any could, escape it or drop the `html` path. — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
