# @d3-polytree/interactive-viewer — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

> ⚠ **security** — the top row touches an HTML-injection surface; treat it first.

## Documentation that lies (docs claim behavior the code lacks)

_None._

## Latent bugs (looks broken, not merely non-obvious)

_None open._

## Dead / orphaned code

_None._

## Open questions (unresolved _why_ — needs a maintainer)

_None._

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue                                                            | Evidence (was)                                                                | Resolved   | How confirmed                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ⚠ `DomNotifications._fillText` innerHTML on `html:true` was an unguarded XSS surface | `packages/interactive-viewer/src/notifications/DomNotifications.ts#_fillText` | 2026-09-23 | Hardened: `text` always renders as textContent; markup requires the dedicated `trustedHtml` field (a separate field, not a boolean on `text`), so untrusted content can't reach innerHTML by flipping a flag. Core `NotificationParams` gained `trustedHtml`; `noticePopup` updated. |

---

_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
