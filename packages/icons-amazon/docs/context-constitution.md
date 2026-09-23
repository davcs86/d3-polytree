# @d3-polytree/icons-amazon — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the reference
icon pack — the filename-is-the-type contract and the pack-composition contract with core. Does not
restate the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/icons-amazon**.

## Rules (`ICONS-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **ICONS-01** | The SVG **filename is the public node `type`, verbatim** (category prefix included). The generator keys each entry by `file.replace(/\.svg$/,'')`, and core's `IconLoader.symbolHref` returns `#<type>_icon_def` on that same string. | Renaming/normalizing an svg (dropping the `Storage_`/`Compute_` prefix, slugifying) or hand-adding a map key that isn't a filename silently breaks every node whose `type` referenced the old key — the icon falls back to `#default_icon_def` with **no error**. | `packages/icons-amazon/scripts/generate-icons.mjs#entries`, `packages/core/src/draw/IconLoader.ts#symbolHref`, `packages/icons-amazon/src/index.test.ts` | `packages/icons-amazon/scripts/generate-icons.mjs#entries` |
| **ICONS-02** | The `icons` factory must spread `{ ...createIcons(), ...pack }` (core defaults **first**, pack **last**) and be composed **after** core so didi last-wins merges packs instead of clobbering sibling packs. | Returning only the pack's own map drops other packs' contributions; composing before core loses the override entirely. (`default` survives regardless — `IconLoader._init` re-injects it — so the spread's real job is preserving *other* packs.) | `packages/icons-amazon/src/index.ts#awsIconsModule`, `packages/core/src/draw/index.ts#iconsModule` | `packages/icons-amazon/src/index.ts#awsIconsModule` |

## Norms (`ICONS-*`) — defaults & asymmetry guidance

| ID | Norm | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **ICONS-N03** | Every bundled SVG carries `id="Layer_1"`; correctness relies on core's `IconLoader.namespaceIds` rewriting ids to `<key>_<id>` per symbol. | Removing that namespacing yields 8 colliding `Layer_1` ids in one `<defs>`. | `packages/icons-amazon/src/svg/` (all share `id="Layer_1"`), `packages/core/src/draw/IconLoader.ts#namespaceIds` | `packages/core/src/draw/IconLoader.ts#namespaceIds` |

## Gotchas & scars

- **Unknown `type` is contractually safe:** `symbolHref` falls back to `#default_icon_def` and `IconLoader` always injects a `default` symbol, so callers need not guard for a missing icon. Evidence: `packages/icons-amazon/src/index.test.ts`, `packages/core/src/draw/IconLoader.ts#_init`.

## Candidate rules (unverified)

_None._

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| Icon-pack = didi module, `{...createIcons(), ...pack}`, composed after core | `packages/icons-amazon/src/index.ts`, root `CLAUDE.md#Nodes, types, and icons` |
| `catalog/**` is eslint-ignored | `eslint.config.js#ignores` |
| Generated file is do-not-hand-edit; regenerate via `build` | `packages/icons-amazon/src/icons.generated.ts` header, root `PLAT-04` |
| README-only edits need a `patch` changeset; absolute `/tree/main/` links | root `CLAUDE.md#Package READMEs` |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
