# @d3-polytree/icons-amazon — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say | What the code does | Evidence | Suggested action |
|---|---|---|---|
| README section headings | uses `## The icon-pack convention` / `## Authoring your own pack` / `## Exports` instead of the template's `## Usage`/`## API` + feature table | `packages/icons-amazon/README.md`, `docs/README-template.md` | Restructure to the template (deferred — larger editorial change) |

## Latent bugs (looks broken, not merely non-obvious)

_None._

## Dead / orphaned code

_None open._

## Open questions (unresolved *why* — needs a maintainer)

- Are the 8 bundled icons intentionally a hand-renamed curated set (making "promote from catalog" aspirational), or should they be re-derived so keys line up? — status: **open**

## Dismissed (won't fix)

| What the docs say / issue | Evidence | Dismissed | Reason |
|---|---|---|---|
| `package.json#description` says "d3-polytree **v2** ecosystem" | `packages/icons-amazon/package.json` | 2026-09-23 | "v2 ecosystem" is a product-generation label used consistently by the root `README.md` and `ROADMAP.md`; the `CLAUDE.md` rule forbids **linking a `v2` branch**, not the generation label. No change. |

## Resolved

| What the docs say / issue | Evidence (was) | Resolved | How confirmed |
|---|---|---|---|
| README: "promote the full set with no code change" | `packages/icons-amazon/README.md#Scope` | 2026-09-23 | README fixed: curated `src/svg/` icons are hand-renamed, not a key-for-key subset; copying catalogue files adds new filename-keyed `type`s |
| README: `@d3-polytree/core` is a "bundled workspace dependency" | `packages/icons-amazon/tsup.config.ts#external` | 2026-09-23 | README fixed: core is kept external at build, not bundled |
| Dead legacy `.eslintrc` | `packages/icons-amazon/.eslintrc` | 2026-09-23 | Deleted |

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
