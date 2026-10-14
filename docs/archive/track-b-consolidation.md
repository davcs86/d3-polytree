# Archive — Track B (consolidate & modernize the v2 monorepo)

> **Archived from [`ROADMAP.md`](../../ROADMAP.md)** (as of `main` @ `c931aa8`, 2026-10-14). Covers phases B0–B8 and B10, the v2 audit (§3.2), the de-jQuery plan (§7.5) and the original first-PR list (§10). **B9 is not archived** — it is still open.
> Text under a **From §N** heading is moved **verbatim** — original `§`/`B*`/`C*`/`H*`/`G*` ids are
> unchanged, so existing references keep resolving through the stubs left in `ROADMAP.md`. The only
> new prose is under **Archive-time verification**, which records how completion was checked.

## From §1 — B3 status note

> **Status — B3 engine consolidation complete.** The `v2.0-beta` engine (staged as the
> `@d3-polytree/core-v2beta` import) has been fully carved into TypeScript packages and that
> staging package is now **retired**:
>
> - **`@d3-polytree/canvas`** — the base canvas/registry/exporting layer (de-duplicated with `d3-canvas`).
> - **`@d3-polytree/pfdn-moddle`** — the `.pfdn` moddle model + XML reader/writer.
> - **`@d3-polytree/core`** — the full engine: the `draw` layer (nodes/links/labels/zones, icons,
>   markers, defs, registries), the `model` provider (with settings normalisation), the `modelling`
>   layer (four element handlers + orchestrator), and **every `features/*` module** — pan/zoom,
>   grid/axes, background, mouse events, selection, outline, drag, export, localStorage, upload, the
>   palette (toolbar + add-handlers + link tool), resize, alert icons, tooltip, notifications — each
>   ported to slim modular **D3 v7** peers, off the removed `d3.event` global and legacy
>   `min-dom`/`lodash`/`q`/`xml2js`/`d3-tip` deps.
> - **`@d3-polytree/viewer` / `interactive-viewer` / `editor`** — compose those modules (in the
>   correct boot order) into working components that render and edit a `.pfdn` document end-to-end.
>
> Remaining Track B work is the companion **panels** (search-panel, side-tabs, properties-panel —
> B6 de-jQuery) and the cross-cutting toolchain/CI/Storybook/distribution items below.

## From §3.2 — `v2.0-beta` + companion repos: findings

| #   | Sev    | Finding                                                                                                                                                                     | Impact                                                                                                     |
| --- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| G1  | **S2** | **Frozen 2017 toolchain** across all repos: webpack 1–3, rollup 0.45, node-sass 4, ESLint 3/4, uglify-js 2/3.                                                               | Won't build reliably on modern Node; no ESM/`exports`; slow, unmaintained loaders.                         |
| G2  | **S2** | **Fragmentation via `github:` deps.** Packages reference each other and unreleased forks (`d3-canvas`, `pfdn-moddle`, `scroll-tabs`, `pfdn-moddle`) by git URL, not semver. | No reproducible dependency resolution; a change ripples across repos by hand. Not published to npm.        |
| G3  | **S2** | **`d3-canvas` duplicated.** Its `lib/core/*` is copy-vendored into v2 `lib/base/core/*`.                                                                                    | Two divergent copies of the base canvas; bug fixes must be applied twice.                                  |
| G4  | **S2** | **jQuery-era properties panel.** `jquery` 1.11 + `jquery-ui` + `slickgrid` + `spectrum-colorpicker` + `choices.js`.                                                         | Largest bundle and biggest security/maintenance liability; several deps unmaintained.                      |
| G5  | **S2** | **Modular D3 at v1.** `d3-selection/zoom/drag/force/scale/dispatch/collection` pinned to 1.x.                                                                               | Three majors behind v7; `d3-collection` is deprecated/removed in v7 (migrate to `Map`/`Set` + `d3-array`). |
| G6  | **S3** | **Runtime `xml2js` persists in v2** devDeps for icon parsing.                                                                                                               | Same class of issue as F3; move icon parsing to build time.                                                |
| G7  | **S3** | **Duplicated per-repo config** (`.eslintrc`, `postcss.config.js`, sass setup).                                                                                              | Drift; a monorepo collapses this to shared config.                                                         |
| G8  | **S3** | **No unit tests** except `pfdn-moddle` (mocha/chai) and `scroll-tabs` (karma).                                                                                              | Consolidation should carry `pfdn-moddle`'s tests forward and backfill the rest.                            |

## From §6 — Track B phases B0–B8 and B10

| Phase                                      | Deliverable                                       | Exit criteria                                                                                                                                                                                                                                                        | Effort |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **B0 — Monorepo scaffold**                 | pnpm + Turborepo workspace                        | Empty-but-wired workspace: shared `tsconfig.base`, flat ESLint, Prettier, Vitest, Changesets, Turbo task graph; CI green on an empty build                                                                                                                           | M      |
| **B1 — Absorb repos (history-preserving)** | 8 repos → `packages/*`                            | Each repo imported via `git subtree`/`git filter-repo` **preserving history**; `github:` cross-deps replaced with `workspace:*`; builds still pass on old toolchain in-place                                                                                         | M      |
| **B2 — De-duplicate & model**              | `@d3-polytree/canvas`, `@d3-polytree/pfdn-moddle` | Vendored `lib/base/core` deleted in favor of `canvas` (**G3**); `pfdn-moddle` tests run green in the workspace (**G8**)                                                                                                                                              | M      |
| **B3 — Toolchain migration**               | modern build per package                          | Vite/tsup lib mode → ESM+CJS+`.d.ts`, `exports`/`types`/`sideEffects` maps; node-sass→dart-sass/PostCSS; drop webpack 1–3/rollup 0.45/uglify (**G1, F7, F15**); build-time icons (**G6**)                                                                            | L      |
| **B4 — TypeScript migration**              | typed packages                                    | Incremental JS→TS (allowJs bridge) starting at `canvas`/`core`; strict mode; public `.d.ts` for every package; typed options API                                                                                                                                     | L      |
| **B5 — D3 v7 + native collections**        | modern D3                                         | Modular D3 v1→v7 as **peer deps**; `d3-collection`→`Map`/`Set`+`d3-array` (**G5**); interaction parity verified via Storybook visual tests                                                                                                                           | L      |
| **B6 — De-jQuery properties panel**        | modern `properties-panel`                         | Replace jquery-ui/slickgrid/spectrum/choices/scroll-tabs (**G4**, §7.5); absorb `scroll-tabs`; feature-parity checklist vs 2017 panel                                                                                                                                | XL     |
| **B7 — Storybook**                         | dev/docs harness                                  | Stories for viewer, interactive-viewer, editor, search-panel, side-tabs, properties-panel, icon packs; visual-regression wired (**§7.1**)                                                                                                                            | M      |
| **B8 — a11y + theming**                    | accessible, themeable                             | SVG `role`/`<title>`/`<desc>`, keyboard nav/focus; CSS custom properties; drop normalize/Bootstrap remnants (**F14, F11**)                                                                                                                                           | M      |
| **B10 — Transactional modelling**          | `commandStack` in `@d3-polytree/core`             | Every model mutation flows through `commandStack.execute`; `execute`/`revert` round-trips are XML-identical; multi-element gestures are one undo entry; `undo()`/`redo()` on the components; `document.changed` dirty flag. Full spec in **§12**; decided in **O11** | L      |

## From §7.5 — De-jQuery migration (properties-panel, B6)

The 2017 properties panel is the single largest liability. Proposed replacements (framework-free):

| Legacy dep             | Purpose                         | Modern replacement (candidate)                                                     |
| ---------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `jquery` / `jquery-ui` | DOM + widgets                   | native DOM + small typed helpers (`min-dom` successor)                             |
| `slickgrid`            | data grid (spreadsheet entries) | headless grid (e.g. a lightweight virtualized grid) or a purpose-built typed table |
| `spectrum-colorpicker` | color picker                    | native `<input type="color">` or a small vanilla picker                            |
| `choices.js`           | select/autocomplete             | native `<select>` + a small combobox, or a maintained vanilla lib                  |
| `scroll-tabs`          | scrollable tab strip            | absorb + reimplement with `ResizeObserver`/`scrollIntoView`                        |

Each replacement is gated by a Storybook story and a feature-parity check against the 2017 panel.

## From §10 — Immediate next actions (first PRs)

1. **Fix F1** (import casing) — one-line change; unblocks Linux/CI. _(A1)_
2. **Remove runtime `xml2js`** on `master` — pre-parse icons at build; delete the README manual-patch
   step. _(A1 / F2 / F3)_
3. **Add GitHub Actions** on `master` — `install → build` on Linux to prevent F1-class regressions. _(A4)_
4. **Commit lockfile; gitignore `dist/`.** _(A3 / F12)_
5. **Stand up the monorepo skeleton** on a `v2` branch under the `@d3-polytree/*` scope (O2): pnpm +
   Turborepo + Changesets + shared TS/ESLint/Vitest/Storybook scaffolding — no code moved yet. _(B0)_
6. **Absorb the 8 repos with `git filter-repo`** (O6) into `packages/*` subdirectories, preserving
   authorship/history, then swap `github:` cross-deps for `workspace:*`. _(B1)_

Each is small, independently reviewable, and moves the ecosystem toward a green baseline before the
consolidation phases begin.

## Archive-time verification (2026-10-14)

Checked against the working tree on `main`, the GitHub tags/releases, and CI workflows — not against
the roadmap's own claims.

| Item                        | Evidence                                                                                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B0 scaffold                 | `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json` (`"strict": true`), flat `eslint.config.js`, `.changeset/`                                                                                                                                                                      |
| B1 absorb repos / B2 de-dup | `packages/{canvas,pfdn-moddle}`; no vendored `lib/base/core`; `@d3-polytree/*@0.1.0` tags for the absorbed panels                                                                                                                                                                         |
| B3 toolchain                | per-package `tsup.config.ts`, `exports` maps, dart-sass `style.css`, build-time `icons-amazon`; no `webpack`/`rollup`/`xml2js` in any `package.json` (**G1, G6, F7, F15**)                                                                                                                |
| B3 UMD (O8)                 | `iife` target in `tsup.config.ts` of `viewer`, `interactive-viewer`, `editor`, `element`                                                                                                                                                                                                  |
| B4 TypeScript               | all `packages/*/src` are `.ts`/`.tsx`; strict base config                                                                                                                                                                                                                                 |
| B5 D3 v7                    | `core` peers `d3-selection ^3`, `d3-zoom ^3`, `d3-transition ^3`, `d3-scale ^4`, `d3-axis ^3`, `d3-drag ^3` (the D3 v7 line); no `d3-collection` (**G5**)                                                                                                                                 |
| B6 de-jQuery                | no `jquery`/`slickgrid`/`spectrum`/`choices.js` in any `package.json`; panel lives in `packages/editor/src/properties-panel/`, `scroll-tabs` absorbed (O4); panels folded per O10 (`track-b-fold-panels`); `spreadsheet` entry in `EntryFactory.ts` replaced slickgrid (O9 spike outcome) |
| B7 Storybook                | `apps/storybook` (`@storybook/html-vite`); `.github/workflows/deploy-storybook.yml` publishes Pages                                                                                                                                                                                       |
| B8 a11y + theming           | delivered as C2 and C13 (see `c-series-shipped.md`)                                                                                                                                                                                                                                       |
| B10 CommandStack            | delivered as C1; see `rfc-commandstack.md` for the exit-criteria audit                                                                                                                                                                                                                    |
| G2 `github:` deps           | publishing via Changesets + OIDC (`release.yml`); `workspace:*` between packages                                                                                                                                                                                                          |
| G7 / G8                     | one shared config at the repo root; Vitest suites per package (+ `pfdn-moddle` round-trips)                                                                                                                                                                                               |

**Not archived — B9 (Release).** Evidence it is still open: every package is `0.x` (no `2.0.0`); no
v1→v2 / beta→v2 migration guide exists in the tree (grep for "migrat" matches only `ROADMAP.md` and
the theming design docs); no explicit npm provenance setting in `release.yml`/`publish.mjs`. Done:
Changesets-driven versioning and publish, Storybook deployed as the docs site.
