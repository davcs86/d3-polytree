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
| `CLAUDE.md` lists `pnpm format:check` as a project command | **No** workflow runs `format:check`; CI is only lint→typecheck→test→build→build-storybook, so unformatted code merges green | `.github/workflows/*` (no `format` match) | Either add a format gate to CI or note in `CLAUDE.md` that it is unenforced |

## Latent bugs (looks broken, not merely non-obvious)

_None open._

## Dead / orphaned code

_None open._

## Open questions (unresolved *why* — needs a maintainer)

- Terminal components declare no `peerDependencies` for core's 6 D3 slices — is peer surfacing intended to be transitive, or a packaging gap? — status: **open** (see constitution candidate)
- `eslint.config.js#no-restricted-syntax` bans `collections.add/remove` outside `commands.ts`/`ModellingElement.ts`, its comment says the "authoritative totality gate is the execute→revert `toXML` round-trip harness" — where does that harness live and is it wired into `pnpm test`? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue | Evidence (was) | Resolved | How confirmed |
|---|---|---|---|
| `layout` absent from root `CLAUDE.md` architecture graph | `grep -c layout CLAUDE.md` = 0 | 2026-09-23 | Added `layout` (+ `ssr`) to the architecture graph and bullets in `CLAUDE.md` |
| `layout` & `ssr` absent from `README.md` package table | `README.md` grep = 0 | 2026-09-23 | Added both rows to the README package table |
| Generated-file drift gate covered only `pfdn-moddle` | `.github/workflows/ci.yml` | 2026-09-23 | Gate extended to run `generate-icons.mjs` + `generate-styles.mjs` and diff all three generated files |
| `.prettierignore` exempted only `pfdn.generated.ts` | `.prettierignore` | 2026-09-23 | Added `icons.generated.ts` + `styles.generated.ts` |
| Dead legacy `.eslintrc` files | `packages/canvas/.eslintrc`, `packages/icons-amazon/.eslintrc` | 2026-09-23 | Deleted both (flat config never read them) |

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items above are defects to
action, not rules to keep — nothing the scan found is discarded (CF-N8). Re-run
`/context-constitution refresh` to catch newly-resolved rows and pick up new defects._
