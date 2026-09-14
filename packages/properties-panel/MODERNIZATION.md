# @d3-polytree/properties-panel — modernization status

**Modernized (Track B / B6).** Converted from the 2017 jQuery-era source to **TypeScript +
ESM** with native DOM and a Vitest (jsdom) suite. History is preserved (imported via
`git subtree` in B1; see `git blame`).

De-jQuery / dependency retirement (the manifest listed several libs; only some were actually
used in `lib/`):

- **jquery** (4 call sites) → native DOM.
- **spectrum-colorpicker** → a native **`<input type="color">`** colour entry.
- **scroll-tabs** → native **click-to-select** tabs (the horizontal scroll-detection is
  dropped; the tab strip is a plain, overflow-scrollable list).
- **min-dom** / **lodash** → native DOM + small local `deepGet`/`deepSet`/`debounce`/`startCase`
  helpers.
- **slickgrid**, **choices.js**, **jquery-ui** were in the manifest but unused in `lib/`
  (`SpreadsheetEntryFactory` was an empty stub; `SelectEntryFactory` already built a native
  `<select>`) — dropped entirely.

Structure: `EntryFactory` (text/select/colour/spreadsheet builders), `PfdnPropertiesProvider`
(the Properties + Format tabs and per-element parts), and `PropertiesPanel` (the tabbed shell).
Decoupled from `@d3-polytree/side-tabs` via a structural `SideTabsRegistrar` interface. Ships
`entryFactoryModule`, `pfdnPropertiesProviderModule`, and `propertiesPanelModule` (didi).

`src/style/*.scss` is kept as-is; the CSS-toolchain pass and wiring into `@d3-polytree/editor`
are follow-ups.
