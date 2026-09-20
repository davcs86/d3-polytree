# @d3-polytree/interactive-viewer

The [`@d3-polytree/viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/viewer) plus
**interaction**: pan/zoom, the background grid, pointer-driven **selection/outline**, and the
**side-tabs host + searchable element index**. `InteractiveViewer extends Viewer`, so it keeps the
full viewer API and layers the interaction modules on top.

**[▶ Live demo](https://davcs86.github.io/d3-polytree/?path=/story/components-interactiveviewer--sample-diagram)** in Storybook.

## Install

```sh
pnpm add @d3-polytree/interactive-viewer d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag
```

## Usage

```ts
import { InteractiveViewer } from '@d3-polytree/interactive-viewer';
import '@d3-polytree/interactive-viewer/style.css'; // side-tabs + search panel styling

const viewer = new InteractiveViewer({ container: document.getElementById('app')! });
await viewer.importDiagram(pfdnXml);

viewer.on('selection.changed', (_prev, next) => {
  console.log(next.length, 'element(s) selected');
});
```

Also ships a self-contained **UMD** bundle (`dist/interactive-viewer.umd.js`, global
`d3PolytreeInteractiveViewer`) with D3 inlined for a plain `<script>` drop-in.

## What it adds over `Viewer`

- **Pan & zoom** — mouse-drag panning and scroll-to-zoom (`zoomModule`, `zoomScrollModule`).
- **Background grid & axes** (`backgroundColorModule`, `axesModule`).
- **Selection & outline** — pointer-driven selection with a rendered outline (`mouseEventsModule`,
  `selectionModule`, `outlineModule`).
- **Side tabs + search panel** — a folded-in tab host and a searchable index of the diagram's
  elements.

The interaction modules are ordered **before** the draw modules on purpose: `Zoom` replaces the
canvas drawing layer on boot, and the event-driven features must be subscribed before the drawers
emit their initial `<class>.created` events.

## Folded-in panels

The **side-tabs** and **search-panel** features have no consumer outside the components, so they live
in this package rather than as standalone packages. They are re-exported for advanced composition via
the `modules` option:

```ts
import { InteractiveViewer, sideTabsModule, searchPanelModule } from '@d3-polytree/interactive-viewer';
```

## Styling

Import `@d3-polytree/interactive-viewer/style.css` to style the side-tabs + search chrome. Panel chrome
is themed with `--pfd-color-*` CSS custom properties and follows `prefers-color-scheme`; force a scheme
per instance with a `data-pfd-theme="light|dark"` attribute.

## API

Same surface as [`Viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/viewer)
(`importDiagram`, `createEmpty`, `exportDiagram`, `exportSVG`, `on`/`off`, `get`, `destroy`) plus the
interaction modules above. Ships ESM + CJS + `.d.ts`, the UMD bundle, and compiled CSS at
`./style.css`.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
