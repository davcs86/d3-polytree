# @d3-polytree/core — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance. Maintained,
not write-only (**CF-N12**).

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say                                                                                   | What the code does                                                                                                                                                                   | Evidence                                             | Suggested action                                                                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Root `CLAUDE.md`: "the running **component** registers **itself** as the `d3polytree` value module" | `createModelModule` registers the `ModelHost` object `{ definitions, moddle }` as the value — not a component (any component-level self-registration lives in the viewer subclasses) | `packages/core/src/model/model.ts#createModelModule` | Correct root `CLAUDE.md` to describe the `ModelHost` value, or verify where the component merges itself in |

## Latent bugs (looks broken, not merely non-obvious)

_None open._

## Dead / orphaned code

| What                                                           | Why it looks dead                                                      | Evidence                                                          |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `Modelling.doAction` marked `@deprecated` "removed before 1.0" | May be a live external API kept for one minor, or already dead surface | `packages/core/src/modelling/Modelling.ts#Modelling` (`doAction`) |

## Open questions (unresolved _why_ — needs a maintainer)

- Is the `status` numeric mapping **owned by** `@d3-polytree/pfdn-moddle`'s schema (so core intentionally does not re-declare it), or should core export the const? — status: **open**
- Is `Modelling.doAction` still a supported API for one minor, or safe to delete now? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue                                                  | Evidence (was)                                                             | Resolved   | How confirmed                                                                                                                                                      |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `status` state machine had no shared const (bare literals across ≥3 files) | `packages/core/src/draw/BaseElement.ts`, `features/drag.ts`, `modelling/*` | 2026-09-23 | Added `ElementStatus` (New/Persisted/Dirty/Deleted) in `packages/core/src/model/status.ts`; replaced every literal (identical numeric behavior, CORE-01 preserved) |

---

_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8). Re-run `/context-constitution refresh` to catch newly-resolved rows._
