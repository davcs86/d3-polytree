<!-- context-forge:behavioral-contract:start -->

## How to Act

1. **Don't assume — ask, and surface tradeoffs.** _(enforced by `SB-03` — `meta.title` is a cross-file spec key; `PLAT-03`)_
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** _(enforced by `SB-01` CSS layering + `SB-02` dist-not-src)_
4. **Define success up front, then loop until verified.** _(enforced by `SB-N04` deterministicModules; `PLAT-06`/`PLAT-08` pinned VR)_

<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->

> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · defects: [`docs/context-constitution-findings.md`](docs/context-constitution-findings.md) · inherits the root constitution. Forged by context-forge.

<!-- context-forge:constitution-pointer:end -->

# CLAUDE.md — @d3-polytree/storybook

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

The dev harness / visual-regression baseline / docs site — private, never published, and **ignored by
Changesets**.

- `@storybook/html-vite` (the components are framework-free DOM/SVG). Stories are `src/**/*.stories.@(ts|js)`.
- Shared `.pfdn` fixtures live in `src/sample.ts`; the **`Guides/Kitchensink`** story is the worked
  example of the extension seams (custom feature module, custom node-type drawer, programmatic API).
- Stories import the components' **compiled** CSS (`@d3-polytree/interactive-viewer/style.css`,
  `@d3-polytree/editor/style.css`), so the packages must be built first.
- This app has its own `typecheck` script (it is in the `turbo run typecheck` graph); keep story types
  clean or CI fails.

## The e2e quality net (C8)

`playwright/` holds the Playwright suite that gates on more than "it builds": **visual regression**
(`vr.spec.ts`), **accessibility** (`a11y.spec.ts`, axe-core), and **live interaction**
(`interactions.spec.ts`, real selection + command-stack undo/redo). It runs against the _static_
`storybook-static` build, so `pnpm build && pnpm build-storybook` must run first (`playwright.config.ts`
serves it with `http-server`).

- **Determinism** (the precondition for a non-flaky net): stories seed a `SequentialIdGenerator` via
  `deterministicModules()` (`src/deterministic.ts`), `gotoStory()` disables transitions + emulates
  reduced motion + waits for fonts, and the config uses a fixed viewport.
- **Rendering is container-pinned.** Pixel baselines are byte-unstable across font stacks, so they are
  generated and compared _only_ inside `mcr.microsoft.com/playwright:v<version>-noble`
  (`.github/workflows/visual-regression.yml`), never on a dev host. Keep `@playwright/test` pinned to
  the same version as that image tag. CI **auto-seeds** the baselines under `playwright/__screenshots__/`
  on the first push to a branch, then gates. To refresh them intentionally, dispatch the workflow with
  `update_snapshots: true` (or delete the tree and re-push).
- **a11y gates on regressions**, not perfection: `a11y-baseline.json` records the serious/critical rule
  ids currently known to fire (empty today); a new one fails the build. Refresh with
  `pnpm --filter @d3-polytree/storybook test:e2e:update-a11y` (C2 will shrink it toward empty).
- The `Tests/Interaction Harness` story is fixture-only (`tags: ['!autodocs']`) — it parks a live
  `Editor` on `window` for the interaction spec.
- `test:e2e` runs it all; it is deliberately **not** wired into `turbo run test` (which stays a fast,
  browserless unit lane) — the e2e net is its own CI job.
