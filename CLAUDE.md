# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The **d3-polytree** monorepo, on the default **`main`** branch: a pnpm + Turborepo monorepo
publishing the scoped **`@d3-polytree/*`** packages — a TypeScript/ESM toolkit for interactive
polytree / process-flow diagrams on modular **D3 v7**. The legacy v1 viewer is preserved on the
**`v1`** branch; `main` is the base branch for PRs and Changesets. `ROADMAP.md` is the authoritative
plan and decisions log (O1–O10); consult it before large structural changes.

## Commands

```sh
pnpm install
pnpm build            # turbo run build — tsup per package (+ sass/UMD where configured)
pnpm test             # turbo run test  — vitest (jsdom) per package
pnpm typecheck        # turbo run typecheck — tsc --noEmit per package
pnpm lint             # eslint . (flat config; ignores live in eslint.config.js, not .eslintignore)
pnpm format:check     # prettier --check .
pnpm build-storybook  # static Storybook build (also the CI's last gate)
pnpm storybook        # Storybook dev server (apps/storybook)
```

Scope to one package with `pnpm --filter @d3-polytree/<pkg> <script>`. Run a single test file or
test by name via vitest:

```sh
pnpm --filter @d3-polytree/core test src/features/selection.test.ts
pnpm --filter @d3-polytree/core exec vitest run -t "clears the selection"
```

CI (`.github/workflows/ci.yml`) runs exactly: install (frozen) → lint → typecheck → test → build →
build-storybook. Mirror that before pushing. The package manager is pinned in `packageManager`
(**pnpm 10.x**); use it via corepack — do **not** downgrade to pnpm 9 or bump to pnpm 11 (see Releases).

## Architecture

**Layered composition, not a monolith.** The dependency graph is the mental model:

```
canvas  +  pfdn-moddle  ->  core  ->  viewer  ->  interactive-viewer  ->  editor
                                       (icons-amazon composes into any component)
```

- `@d3-polytree/canvas` — base SVG surface (`Canvas`, `ElementRegistry`, `ElementBuilder`, SVG export).
- `@d3-polytree/pfdn-moddle` — the `.pfdn` XML model (a `moddle` schema). `createPfdnModdle()`,
  `moddle.create('pfdn:Node', …)`, `fromXML`/`toXML`.
- `@d3-polytree/core` — the engine: `draw/` (Nodes/Links/Labels/Zones drawers, `IconLoader`,
  `DrawingRegistry`, defs/markers), `model/`, `modelling/` (four element handlers + create/save/delete
  orchestrator), and `features/*` (pan/zoom, axes, background, mouseEvents, selection, outline, drag,
  exporting, localStorage, upload, palette, resize, tooltip, notifications). Runs on **peer** D3 slices
  (`d3-selection`, `d3-zoom`, `d3-transition`, `d3-scale`, `d3-axis`, `d3-drag`).
- `viewer` → `interactive-viewer` → `editor` are **subclasses** (`Editor extends InteractiveViewer
extends Viewer`), each adding a slice of modules. `side-tabs` + `search-panel` are folded into
  `interactive-viewer/src/`; `properties-panel` into `editor/src/` (they have no standalone package —
  decision O10 — but are re-exported from the parents).

### Dependency injection (didi) — read before touching modules

The engine is wired with **didi**. A module is a plain object:
`{ __init__: ['svc'], __depends__: [otherModule], svc: ['type'|'factory'|'value', X] }`. `Diagram`
(in `core/src/Diagram.ts`) bootstraps an injector from a module list and eagerly instantiates each
`__init__` service. Two invariants govern everything:

1. **Last definition of a token wins.** Composing a module _after_ the core modules overrides that
   token. This is the single extension seam: `new Editor({ modules: [myModule] })` appends caller
   modules **after** the component's own (see `Viewer._boot`), and icon packs rely on it (their
   `icons` factory spreads `createIcons()` then their own). Do not reorder so a core module lands last.
2. **Boot order = event-subscription order.** Drawers emit `<class>.created` (`node.created`,
   `link.created`, …) _during_ boot as they render the loaded model. Any feature that must see those
   initial elements (selection, outline, search-panel, side-tabs) therefore has to be registered
   **before** the drawer modules. That is why components list interaction/feature modules in
   `interactionModules` _ahead of_ `Viewer.modules` (the drawers) in `getModules()`. Moving a
   created-listener after the drawers silently drops the initial elements — a real bug the folded-panel
   tests guard against.

The running component registers itself as the `d3polytree` value module, so drawers/modelling resolve
`d3polytree.definitions` / `d3polytree.moddle` off the instance. `viewer.get('<token>')` reaches any
service on the live engine.

### Nodes, types, and icons

A node draws as a `<use>` of an SVG symbol keyed by its `type` (`iconLoader.symbolHref(type)`), sized
by its `size` attr (moddle default 25 — a node with `size: 0` renders invisibly). An **icon pack** is
just a didi module whose `icons` factory returns `{ ...createIcons(), ...packSvgs }`; `icons-amazon` is
the reference. `icons-amazon` generates `src/icons.generated.ts` from `src/svg/` via
`scripts/generate-icons.mjs` at build time (`catalog/` holds the full unbundled AWS set).

## Gotchas

- **jsdom shims are intentional.** `core` guards against jsdom not implementing `getBBox` (Outline
  falls back to a zero box), `SVGGraphicsElement.transform.baseVal` (Canvas transform → identity), and
  d3-zoom's `defaultExtent` needing an explicit `.extent()`. These are worked around on purpose — don't
  "fix" them as if they were bugs.
- **Cross-package tests read built `dist`, not source.** `pnpm test` is safe (turbo `test` has
  `dependsOn: ^build`), but when running a single dependent-package test directly, rebuild the changed
  upstream package first (`pnpm --filter @d3-polytree/canvas build`) or you test stale output.
- **CSS ships compiled.** Panel SCSS is compiled with **dart-sass** to `dist/style.css` in the same
  `build` script and exposed via the `./style.css` export. `interactive-viewer/style.css` carries
  side-tabs + search; `editor/style.css` carries the properties panel. Editor consumers import both.
- **UMD is a second tsup pass.** The three components emit a self-contained `dist/<name>.umd.js`
  (`format: iife`, `noExternal: [/.*/]`, global `d3Polytree*`) alongside the ESM/CJS library build;
  `clean` belongs to the first pass only.

## Releases

Versioning/publishing is **Changesets** + `.github/workflows/release.yml`. Record changes with
`pnpm changeset`; merging to `main` opens a _Version Packages_ PR; merging that publishes the bumped
packages. Publishing is **hybrid**, routed per package by `scripts/publish.mjs` (the `release` script
runs `turbo run build && node scripts/publish.mjs`):

- **New packages** (a name that 404s on the registry) are published with the **`NPM_TOKEN`** secret.
  Trusted Publishing can't cover a first release — a Trusted Publisher can only be configured on
  npmjs.com _after_ the package exists — so `publish.mjs` bootstraps new names with the token, then
  git-tags them. After that first publish, configure the package's Trusted Publisher so it goes
  tokenless from then on.
- **Existing packages** are published **tokenlessly** via npm **Trusted Publishing (OIDC)** through
  `changeset publish`. The two phases are isolated: `NPM_TOKEN` is injected only into the bootstrap
  subprocess (as `NODE_AUTH_TOKEN`), so the OIDC phase always runs with no token — OIDC is used for
  updates irrespective of npm/pnpm token-vs-OIDC precedence. `changeset publish` skips versions
  already on the registry, so a bootstrapped package is not double-published.

Constraints that are load-bearing (don't regress them):

- Publishing must go through **pnpm** (it rewrites `workspace:*` to real versions) — both phases do
  (`pnpm publish` for the bootstrap, `changeset publish` → pnpm for updates). OIDC therefore needs
  **pnpm 10** (pnpm 9 has no OIDC; pnpm 11 has an OIDC 404 regression).
- The release job upgrades npm to **≥ 11.5.1** (`npm install -g npm@latest`) — the OIDC token exchange
  goes through the npm CLI — and needs `id-token: write` + setup-node `registry-url` + Node ≥ 22.14.
- The **`NPM_TOKEN`** repo secret must exist (npm automation/granular token, publish rights on the
  `@d3-polytree` scope) whenever a release introduces a brand-new package; existing-only releases
  never read it.
- Each already-published package has a Trusted Publisher configured on npmjs.com pointing at this repo
  - `release.yml`.
