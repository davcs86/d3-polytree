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
- Shared `.pfdn` fixtures live in `src/sample.ts` (hand-written XML); the seeded, generated large fixtures for the C10 culling/perf work live in `src/perf/` (`fixture.data.ts` is Node-safe pure data, `fixture.xml.ts` builds the XML through moddle, `harness.ts` mounts the stories); the **`Guides/Kitchensink`** story is the worked
  example of the extension seams (custom feature module, custom node-type drawer, programmatic API).
- Stories import the components' **compiled** CSS (`@d3-polytree/interactive-viewer/style.css`,
  `@d3-polytree/editor/style.css`), so the packages must be built first.
- This app has its own `typecheck` script (it is in the `turbo run typecheck` graph); keep story types
  clean or CI fails.

## The e2e quality net (C8)

`playwright/` holds the Playwright suite that gates on more than "it builds": **visual regression**
(`vr.spec.ts`), **accessibility** (`a11y.spec.ts`, axe-core), and **live interaction**
(`interactions.spec.ts`, real selection + command-stack undo/redo); plus the C10 specs: `harness-filter.spec.ts`,
`fixture.spec.ts` and `culling-probes.spec.ts` run in the same job, and `perf.spec.ts` runs only under `PERF=1`. It runs against the _static_
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
  `Editor` on `window` for the interaction spec. The C10 `Tests/Culling Harness` (~10.6k elements) and
  `Tests/Perf Harness` (~23k) stories are tagged `harness-only`: `loadStories()` omits them so VR/a11y never
  screenshot or axe-scan them (specs opt in with `loadStories({ includeHarness: true })`); arms are chosen
  per load with `&args=culling:!false;viewer:editor` (declare args in `argTypes`; booleans are `!true`/`!false`). The `@internal` `lod` arg (`&args=lod:!false`) is the harness-only zoom-out LOD kill switch that gives the perf gate a same-build baseline; it is not a public option.
  `pnpm build-storybook:deploy` (Pages) drops them via `STORYBOOK_DEPLOY=1`-gated globs — Storybook 8.6.18 has
  no `--exclude-tags`.
- `test:e2e` runs it all; it is deliberately **not** wired into `turbo run test` (which stays a fast,
  browserless unit lane) — the e2e net is its own CI job. The perf lane is separate again (`test:perf`: `PERF=1`, serial,
  `.github/workflows/perf.yml`); the required `chromium` project ignores `perf.spec.ts`. The culling-ON arm asserts the ceiling in `playwright/perf-budget.json` (blocking; derived from a pinned CI run — see `measurements.md` §8). Zoom-out LOD adds a fit-all pan arm (LOD vs `lod:false`) and a crossing arm there (`fitAllPan` / `lodCrossing`, record-only until set from pinned runs — `lod-measurements.md`); the step-0 spikes (`lod-spikes.spec.ts`) only run with `LOD_SPIKES=1`. `culling.spec.ts` holds the LOD correctness gates (`wronglyHeld` oracle) and the real-mouse click-resolver cases; G1–G7 keep a strict oracle by booting with `lod:false`.
