# @d3-polytree/search-panel — modernization status

**Modernized (Track B / B6).** Converted from the 2017 `list.js` / `min-dom` source to
**TypeScript + ESM** with a native filter/sort list and a Vitest (jsdom) suite. History is
preserved (imported via `git subtree` in B1; see `git blame`).

- `list.js` is **dropped**: the panel keeps its own `Map` of items and renders a filtered,
  name-sorted list from the search box directly — no runtime list library.
- `min-dom` is replaced by native DOM.
- Decoupled from `@d3-polytree/side-tabs`: the `sideTabsProvider` token is consumed through a
  structural `SideTabsRegistrar` interface, so there is no hard build dependency between the
  two panel packages.
- Ships `searchPanelModule` (didi) registering a "Search element" side tab.

`src/style.scss` is kept as-is; CSS-toolchain modernization and wiring into
`@d3-polytree/interactive-viewer`/`editor` are follow-ups.
