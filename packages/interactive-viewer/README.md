# @d3-polytree/interactive-viewer

The [`@d3-polytree/viewer`](../viewer) plus interaction: **pan/zoom**, the background grid,
pointer-driven **selection/outline**, and the **side-tabs host + searchable element index**.

```sh
pnpm add @d3-polytree/interactive-viewer d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag
```

```ts
import { InteractiveViewer } from '@d3-polytree/interactive-viewer';
import '@d3-polytree/interactive-viewer/style.css'; // side-tabs + search panel styling

const viewer = new InteractiveViewer({ container: document.getElementById('app')! });
await viewer.importDiagram(pfdnXml);
```

The **side-tabs** and **search-panel** features are bundled into this package (they have no consumer
outside the components) and re-exported as `sideTabsModule` / `searchPanelModule` for advanced
composition via the `modules` option. Ships ESM + CJS + `.d.ts`, a self-contained **UMD** bundle
(global `d3PolytreeInteractiveViewer`), and compiled **CSS** at `./style.css`. Part of the
[d3-polytree](https://github.com/davcs86/d3-polytree) monorepo.

## License

MIT
