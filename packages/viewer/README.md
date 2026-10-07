# @d3-polytree/viewer

The **static, read-only** polytree viewer. It boots the
[`@d3-polytree/core`](https://github.com/davcs86/d3-polytree/tree/main/packages/core) engine against a
loaded `.pfdn` document and renders it — no pan/zoom, selection, or editing. Reach for
[`@d3-polytree/interactive-viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/interactive-viewer)
when you need interaction and
[`@d3-polytree/editor`](https://github.com/davcs86/d3-polytree/tree/main/packages/editor) when you
need to author diagrams.

**[▶ Live demo](https://davcs86.github.io/d3-polytree/?path=/story/components-viewer--sample-diagram)** in Storybook.

## Install

```sh
pnpm add @d3-polytree/viewer d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag
```

The six D3 v7 slices are **peer dependencies** (inherited from `core`); add the ones your app doesn't
already provide.

## Usage

### ESM / bundler

```ts
import { Viewer } from '@d3-polytree/viewer';

const viewer = new Viewer({ container: document.getElementById('app')! });
await viewer.importDiagram(pfdnXml); // parse a .pfdn document and render it
const svg = viewer.exportSVG(); // current rendering as a standalone SVG string
```

### `<script>` (UMD)

Ships a self-contained UMD bundle (`dist/viewer.umd.js`, global `d3PolytreeViewer`) with D3 inlined —
drop it in with a plain `<script>` tag, no bundler required:

```html
<script src="https://cdn.jsdelivr.net/npm/@d3-polytree/viewer/dist/viewer.umd.js"></script>
<script>
  const viewer = new d3PolytreeViewer.Viewer({ container: document.body });
  viewer.importDiagram(pfdnXml);
</script>
```

## API

Constructor: `new Viewer(options?: ViewerOptions)`.

| Option      | Type              | Purpose                                                                                                                 |
| ----------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `container` | `HTMLElement`     | Host element the diagram renders into.                                                                                  |
| `modules`   | `DiagramModule[]` | Extra didi modules layered **after** the component's own (last definition wins) — the no-subclassing extension seam.    |
| `culling`   | `boolean`         | Viewport culling for large diagrams (default on; inert below a drawn-element threshold). Interactive viewer and editor. |

| Method / property                      | Description                                                                                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `importDiagram(xml)` → `Promise<void>` | Parse and render a `.pfdn` document (a reboot). Rejects if it cannot be parsed, leaving the current diagram open. Imports are sequenced: one superseded by a later `importDiagram`/`createEmpty`, or by `destroy()`, resolves without rendering. |
| `createEmpty()`                        | Render a fresh, empty diagram (supersedes a pending import).                                                                                                                                                                                     |
| `exportDiagram()` → `string`           | Serialize the current diagram back to `.pfdn` XML.                                                                                                                                                                                               |
| `exportSVG()` → `string`               | The current rendering as a standalone SVG string.                                                                                                                                                                                                |
| `on(event, handler)` / `off(...)`      | Subscribe to post-boot engine events. Subscriptions **survive `importDiagram` reboots**. Typed per component — see below.                                                                                                                        |
| `get(name, strict?)`                   | Resolve any service from the running engine (`viewer.get('eventBus')`).                                                                                                                                                                          |
| `getHost()`                            | The loaded model host (`{ definitions, moddle }`).                                                                                                                                                                                               |
| `destroy()`                            | Tear down the diagram and drop all subscriptions; a pending import never renders afterwards.                                                                                                                                                     |

`Viewer<E>` is generic over the events its `on()`/`off()` accept, narrowed to what each component's
modules actually emit, so a subscription that could never fire is a compile error:

| Component           | Events (`E`)                                                    | Type alias               |
| ------------------- | --------------------------------------------------------------- | ------------------------ |
| `Viewer`            | none                                                            | `ViewerEvent`            |
| `InteractiveViewer` | `selection.changed`                                             | `InteractiveViewerEvent` |
| `Editor`            | `document.changed`, `selection.changed`, `commandStack.changed` | `EditorEvent`            |

A `Viewer` composed (via `modules`) with a feature that emits one of these opts in with the type
parameter: `new Viewer<'selection.changed'>({ container, modules: [selectionModule] })`.

The running `Viewer` registers itself as the `d3polytree` value module, so drawers/modelling resolve
`d3polytree.definitions` / `d3polytree.moddle` off the instance.

## Where it fits

```
core -> viewer -> interactive-viewer -> editor
```

`InteractiveViewer` and `Editor` are subclasses of `Viewer`, each adding a slice of engine modules.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
