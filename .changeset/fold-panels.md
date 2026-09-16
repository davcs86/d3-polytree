---
"@d3-polytree/interactive-viewer": minor
"@d3-polytree/editor": minor
---

Fold the panel packages into their components (decision O10). `@d3-polytree/side-tabs`
and `@d3-polytree/search-panel` are now internal to `@d3-polytree/interactive-viewer`;
`@d3-polytree/properties-panel` is now internal to `@d3-polytree/editor`. The panels had
no consumer outside the components.

- Their didi modules and public types are re-exported from the parents, so
  `import { sideTabsModule, searchPanelModule } from '@d3-polytree/interactive-viewer'`
  and `import { propertiesPanelModule, entryFactoryModule, pfdnPropertiesProviderModule }
  from '@d3-polytree/editor'` keep working.
- Their compiled CSS now ships as the parents' `./style.css`:
  `@d3-polytree/interactive-viewer/style.css` (side-tabs + search-panel) and
  `@d3-polytree/editor/style.css` (properties panel). Editor consumers import both.

The standalone `@d3-polytree/{side-tabs,search-panel,properties-panel}` packages are
discontinued; the already-published 0.1.0 versions should be deprecated on npm pointing
to their new homes.
