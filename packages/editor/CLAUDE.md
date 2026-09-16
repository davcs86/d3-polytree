# CLAUDE.md — @d3-polytree/editor

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

`InteractiveViewer` + the editing layer. `getModules()` =
`[...InteractiveViewer.interactionModules, ...Editor.editionModules, ...Viewer.modules]`.

- `editionModules` = drag, modelling, exporting, localStorage, upload, palette, resizeElement.
- The former `@d3-polytree/properties-panel` is **folded in** under `src/properties-panel/` (decision
  O10) and re-exported (`propertiesPanelModule`, `entryFactoryModule`, `pfdnPropertiesProviderModule`).
  It is **decoupled from side-tabs** via a structural `SideTabsRegistrar` interface — it resolves the
  `sideTabsProvider` token by shape, not by importing the side-tabs package.
- The `build` script compiles `src/properties-panel/style/style.scss` → `dist/style.css` (`./style.css`
  export = the properties panel only; editor consumers also import `interactive-viewer/style.css`).
- API beyond the base: `createDiagram()` (opens `INITIAL_DIAGRAM`), `createNode(params)`, `select(def)`,
  `deleteSelected()`. Ships a UMD pass (global `d3PolytreeEditor`).
