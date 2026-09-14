# @d3-polytree/side-tabs — modernization status

**Modernized (Track B / B6).** Converted from the 2017 `min-dom` / `lodash` source to
**TypeScript + ESM** with native DOM and a Vitest (jsdom) suite. History/authorship is
preserved (imported via `git subtree` in B1; see `git blame`).

- `SideTabsProvider` — the tab registry (`registerSideTab` / `getSideTabsEntries`), emits
  `sidetab.registered`.
- `SideTabs` — the collapsible tab strip + content panels, with native event delegation
  (`closest`) replacing `min-dom/delegate`.
- Ships `sideTabsModule` (didi) for the editor to compose.

`src/style.scss` is kept as-is; CSS toolchain modernization (node-sass → PostCSS/dart-sass)
and wiring the module into `@d3-polytree/editor` are tracked as follow-ups.
