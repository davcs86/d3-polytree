# d3-polytree (root) — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915` while deriving the constitution — the things an
agent trusting the docs or the surface would get **wrong**. These are for triage/fixing (feed them to
your issue tracker), not governance: a defect is not a rule. Every entry cites the code. This log is
maintained, not write-only (**CF-N12**): re-running `/context-constitution refresh` re-verifies every
open row and retires resolved ones.

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say | What the code does | Evidence | Suggested action |
|---|---|---|---|
| Architecture graph and package list name only `canvas + pfdn-moddle → core → …` | `@d3-polytree/layout` is a **public, publishable** package **and a direct dependency of core**, but appears **0×** in root `CLAUDE.md` | `packages/layout/package.json#name`, `packages/core/package.json` (`"@d3-polytree/layout": "workspace:*"`), `grep -c layout CLAUDE.md` = 0 | Add `layout` to the architecture graph + package list in `CLAUDE.md` |
| README lists the published package surface | Both `@d3-polytree/layout` and `@d3-polytree/ssr` are **absent** from `README.md` though both are public | `README.md` (`grep -c ssr` = 0, `grep -c layout` = 0) | Add `layout` + `ssr` rows to the README package table |
| `CLAUDE.md` lists `pnpm format:check` as a project command | **No** workflow runs `format:check`; CI is only lint→typecheck→test→build→build-storybook, so unformatted code merges green | `.github/workflows/*` (no `format` match) | Either add a format gate to CI or note in `CLAUDE.md` that it is unenforced |

## Latent bugs (looks broken, not merely non-obvious)

| Issue | Impact | Evidence |
|---|---|---|
| The CI "generated files up to date" drift gate covers **only** `pfdn-moddle`; `icons.generated.ts` and `styles.generated.ts` have no equivalent gate | An agent editing `packages/icons-amazon/src/svg/*` or `packages/element` SCSS can commit stale generated output and CI stays green (build regenerates in-tree but never diffs; a turbo cache hit can mask it) | `.github/workflows/ci.yml#"Verify generated files are up to date"` (runs `generate-pfdn.mjs` + `git diff --exit-code` on `pfdn.generated.ts` alone) |
| `.prettierignore` exempts only `pfdn.generated.ts`; `icons.generated.ts` / `styles.generated.ts` are not exempt | `pnpm format` would rewrite the other two generated files (low impact only because format is ungated — see above) | `.prettierignore` |

## Dead / orphaned code

| What | Why it looks dead | Evidence |
|---|---|---|
| Per-package legacy `.eslintrc` files | The repo uses flat config (`eslint.config.js`); ESLint flat config never reads `.eslintrc`, so these lint nothing and their rules contradict the ESM/TS packages | `packages/canvas/.eslintrc`, `packages/icons-amazon/.eslintrc` |

## Open questions (unresolved *why* — needs a maintainer)

- Terminal components declare no `peerDependencies` for core's 6 D3 slices — is peer surfacing intended to be transitive, or a packaging gap? — status: **open** (see constitution candidate)
- `eslint.config.js#no-restricted-syntax` bans `collections.add/remove` outside `commands.ts`/`ModellingElement.ts`, its comment says the "authoritative totality gate is the execute→revert `toXML` round-trip harness" — where does that harness live and is it wired into `pnpm test`? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items above are defects to
action, not rules to keep — nothing the scan found is discarded (CF-N8). Re-run
`/context-constitution refresh` to catch newly-resolved rows and pick up new defects._
