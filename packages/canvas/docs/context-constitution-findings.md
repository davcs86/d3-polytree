# @d3-polytree/canvas — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None._

## Latent bugs (looks broken, not merely non-obvious)

| Issue                                                                                                                                             | Impact                                                              | Evidence                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| The engine narrows transforms to translate+scale (`getTransform` reads only `a/d/e/f`); a matrix carrying `b/c` (skew/rotate) is silently dropped | A future rotation/skew would be lost with no error (see `PLAT-N09`) | `packages/canvas/src/Canvas.ts#getTransform` |

## Dead / orphaned code

_None open._

## Open questions (unresolved _why_ — needs a maintainer)

- What caller passes `prefix === ''` to `ElementBuilder.create`, and is the silent skip a real "don't register" signal or a guard that should throw? — status: **open** (`packages/canvas/src/ElementBuilder.ts#create`)
- Is the `getSvgString` temp-attr + regex the intended xlink-namespace fix (Safari) or replaceable with `setAttributeNS`? — status: **open** (`packages/canvas/src/SvgExportingUtils.ts#getSvgString`)

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue | Evidence (was)              | Resolved   | How confirmed                       |
| ------------------------- | --------------------------- | ---------- | ----------------------------------- |
| Dead legacy `.eslintrc`   | `packages/canvas/.eslintrc` | 2026-09-23 | Deleted (flat config never read it) |

---

_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
