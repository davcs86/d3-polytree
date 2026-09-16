# @d3-polytree/editor

The full polytree **editor** — the [`@d3-polytree/interactive-viewer`](../interactive-viewer) plus the
editing layer: element dragging, the create/save/delete modelling flows, the palette toolbar, and the
**properties panel**.

```sh
pnpm add @d3-polytree/editor d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag
```

```ts
import { Editor } from '@d3-polytree/editor';
import '@d3-polytree/interactive-viewer/style.css'; // side-tabs + search panels
import '@d3-polytree/editor/style.css';             // properties panel

const editor = new Editor({ container: document.getElementById('app')! });
await editor.createDiagram();                                   // open the starter diagram
const node = editor.createNode({ type: 'default', position: { x: 80, y: 80 } });
editor.select(node);
editor.deleteSelected();
const xml = editor.exportDiagram();                            // serialize to .pfdn
```

The **properties-panel** feature is bundled into this package and re-exported (`propertiesPanelModule`,
`entryFactoryModule`, `pfdnPropertiesProviderModule`). Layer in custom engine modules — a feature, a
custom node-type drawer, an [icon pack](../icons-amazon) — through the `modules` constructor option;
see the Storybook **Guides/Kitchensink** story. Ships ESM + CJS + `.d.ts`, a self-contained **UMD**
bundle (global `d3PolytreeEditor`), and compiled **CSS** at `./style.css`. Part of the
[d3-polytree](https://github.com/davcs86/d3-polytree) monorepo.

## License

MIT
