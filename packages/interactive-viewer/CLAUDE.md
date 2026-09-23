<!-- context-forge:behavioral-contract:start -->

## How to Act

1. **Don't assume — ask, and surface tradeoffs.** _(enforced by `IV-01` — structural, not concrete, panel coupling; `PLAT-03`)_
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** _(enforced by `IV-02` + `PLAT-01` — the notifications override module stays last)_
4. **Define success up front, then loop until verified.** _(enforced by `PLAT-06` determinism)_

<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->

> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · defects: [`docs/context-constitution-findings.md`](docs/context-constitution-findings.md) · inherits the root constitution. Forged by context-forge.

<!-- context-forge:constitution-pointer:end -->

# CLAUDE.md — @d3-polytree/interactive-viewer

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

`Viewer` + interaction. `getModules()` returns `[...interactionModules, ...Viewer.modules]` — the
interaction/feature modules come **first** on purpose (root `CLAUDE.md`, boot-order rule).

- `interactionModules` = backgroundColor, zoom, zoomScroll, axes, mouseEvents, selection, outline, then
  the folded **sideTabs** + **searchPanel** modules.
- The former `@d3-polytree/side-tabs` and `@d3-polytree/search-panel` packages are **folded in** here
  under `src/side-tabs/` and `src/search-panel/` (decision O10) and re-exported from `index.ts`
  (`sideTabsModule`, `searchPanelModule`, …). Their tests moved with them.
- `src/style.scss` aggregates both panels' SCSS; the `build` script compiles it to `dist/style.css`
  (exposed as `./style.css`). It carries side-tabs **and** search-panel styling.
- Because it embeds the panels, this package directly depends on `@d3-polytree/canvas` (a `Canvas`
  type) and `eventemitter3`.
