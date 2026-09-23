# @d3-polytree/icons-amazon — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say | What the code does | Evidence | Suggested action |
|---|---|---|---|
| README/CLAUDE: the 8 bundled icons are "promoted from `catalog/` with no code change" | **none** of the 8 bundled filenames exist in `catalog/` (catalog uses different keys, e.g. `ApplicationServices_AmazonAPIGateway` vs bundled `MobileServices_AmazonAPIGateway`); a `cp catalog/*.svg src/svg/` adds ~300 *differently-keyed* icons | `packages/icons-amazon/README.md#Scope`, `packages/icons-amazon/CLAUDE.md#Scope`, `packages/icons-amazon/catalog/` vs `src/svg/` | Correct the "promote with no code change" claim, or re-derive the 8 from their real catalog counterparts |
| `package.json#description`: "d3-polytree **v2** ecosystem" | root `CLAUDE.md`: "There is no `v2` branch; never link one" | `packages/icons-amazon/package.json` | Decide if "v2" is an intended product label or scrub it |
| README section headings | uses `## The icon-pack convention` / `## Authoring your own pack` / `## Exports` instead of the template's `## Usage`/`## API` + feature table | `packages/icons-amazon/README.md`, `docs/README-template.md` | Restructure to the template |

## Latent bugs (looks broken, not merely non-obvious)

_None._

## Dead / orphaned code

| What | Why it looks dead | Evidence |
|---|---|---|
| Legacy `.eslintrc` (`"es6": false`, `"commonjs": true`, `extends: eslint:recommended`) | flat config never reads it; settings contradict this ESM/TS package | `packages/icons-amazon/.eslintrc` |

## Open questions (unresolved *why* — needs a maintainer)

- Are the 8 bundled icons intentionally a hand-renamed curated set (making "promote from catalog" aspirational), or should they be re-derived so keys line up? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
