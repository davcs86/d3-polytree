# @d3-polytree/viewer

The **static, read-only** polytree viewer — boots the [`@d3-polytree/core`](../core) engine against a
loaded `.pfdn` document and renders it. No pan/zoom or interaction (see
[`@d3-polytree/interactive-viewer`](../interactive-viewer) and [`@d3-polytree/editor`](../editor)).

```sh
pnpm add @d3-polytree/viewer d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag
```

```ts
import { Viewer } from '@d3-polytree/viewer';

const viewer = new Viewer({ container: document.getElementById('app')! });
await viewer.importDiagram(pfdnXml);
const svg = viewer.exportSVG();
```

Also ships a self-contained **UMD** bundle (`dist/viewer.umd.js`, global `d3PolytreeViewer`) with D3
inlined for a plain `<script>` tag. Extra engine modules can be layered in via the `modules`
constructor option. Part of the [d3-polytree](https://github.com/davcs86/d3-polytree) monorepo.

## License

MIT
