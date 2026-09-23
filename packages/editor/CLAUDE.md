<!-- context-forge:behavioral-contract:start -->
## How to Act

1. **Don't assume — ask, and surface tradeoffs.** *(enforced by `EDITOR-01` — `element.updateProperties` is the one editor-owned command; `PLAT-03`)*
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** *(enforced by `EDITOR-02` deepGet/deepSet undo capture + `EDITOR-03` module tier; `PLAT-04`)*
4. **Define success up front, then loop until verified.** *(enforced by `PLAT-01` notifications-last; `PLAT-06` determinism)*
<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->
> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · defects: [`docs/context-constitution-findings.md`](docs/context-constitution-findings.md) · inherits the root constitution. Forged by context-forge.
<!-- context-forge:constitution-pointer:end -->

# CLAUDE.md — @d3-polytree/editor

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

`InteractiveViewer` + the editing layer. `getModules()` =
`[...InteractiveViewer.interactionModules, ...Editor.editionModules, ...Viewer.modules]`.

- `editionModules` = drag, modelling, exporting, localStorage, upload, autoLayout, palette,
  resizeElement, then the three properties-panel modules (entryFactory, pfdnPropertiesProvider,
  propertiesPanel).
- The former `@d3-polytree/properties-panel` is **folded in** under `src/properties-panel/` (decision
  O10) and re-exported (`propertiesPanelModule`, `entryFactoryModule`, `pfdnPropertiesProviderModule`).
  It is **decoupled from side-tabs** via a structural `SideTabsRegistrar` interface — it resolves the
  `sideTabsProvider` token by shape, not by importing the side-tabs package.
- The `build` script compiles `src/style.scss` → `dist/style.css`; the `./style.css` export
  aggregates the properties panel **plus** the palette, drag cursor, and interactive-viewer tokens
  (editor consumers also import `interactive-viewer/style.css`).
- API beyond the base: `createDiagram()` (opens `INITIAL_DIAGRAM`), `createNode(params)`, `select(def)`,
  `deleteSelected()`, `autoLayout(opts?)`, `setLinkPinned(id, pinned?)`, `undo()`/`redo()`,
  `canUndo()`/`canRedo()`. Ships a UMD pass (global `d3PolytreeEditor`).
