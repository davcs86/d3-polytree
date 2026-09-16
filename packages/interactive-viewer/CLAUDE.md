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
