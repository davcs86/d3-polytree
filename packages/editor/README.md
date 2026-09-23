# @d3-polytree/editor

The full polytree **editor** — the
[`@d3-polytree/interactive-viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/interactive-viewer)
plus the editing layer: element dragging, the create/save/delete modelling flows, auto-layout, the
palette toolbar, and the **properties panel**. `Editor extends InteractiveViewer extends Viewer`, so
it inherits the entire viewer/interaction API.

**[▶ Live demo](https://davcs86.github.io/d3-polytree/?path=/story/components-editor--initial-diagram)** in Storybook.

## Install

```sh
pnpm add @d3-polytree/editor d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag
```

## Usage

```ts
import { Editor } from '@d3-polytree/editor';
import '@d3-polytree/interactive-viewer/style.css'; // side-tabs + search panels
import '@d3-polytree/editor/style.css'; // properties panel

const editor = new Editor({ container: document.getElementById('app')! });

await editor.createDiagram(); // open the starter diagram
const node = editor.createNode({ type: 'default', position: { x: 80, y: 80 } });
editor.select(node);
editor.deleteSelected();

await editor.autoLayout({ direction: 'TB' }); // one undoable re-layout
editor.undo();
editor.redo();

const xml = editor.exportDiagram(); // serialize to .pfdn
```

### `<script>` (UMD)

```html
<script src="https://cdn.jsdelivr.net/npm/@d3-polytree/editor/dist/editor.umd.js"></script>
<script>
  const editor = new d3PolytreeEditor.Editor({ container: document.body });
  editor.createDiagram();
</script>
```

## API

Everything on [`Viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/viewer) /
`InteractiveViewer`, plus the editing surface:

| Method                                   | Description                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `createDiagram()` → `Promise<void>`      | Open the built-in starter diagram.                                                                                                     |
| `createNode(params?)` → element          | Create a node (`{ type, position }`) as an undoable command.                                                                           |
| `select(definition)`                     | Select an element programmatically.                                                                                                    |
| `deleteSelected()`                       | Delete the current selection.                                                                                                          |
| `autoLayout(options?)` → `Promise<void>` | Re-lay the whole diagram (layered/Sugiyama) as a **single undoable command**. Provide a `layoutRunner` DI value to run it on a Worker. |
| `setLinkPinned(id, pinned?)`             | Pin/unpin a link's routing (`pinned` defaults to `true`) as an undoable command.                                                       |
| `undo()` / `redo()`                      | Walk the command stack.                                                                                                                |
| `canUndo()` / `canRedo()` → `boolean`    | Whether the command stack currently has anything to undo / redo.                                                                       |

## Styling & theming

Editor consumers import **both** stylesheets — `@d3-polytree/interactive-viewer/style.css` (side-tabs +
search) and `@d3-polytree/editor/style.css` (properties panel). The panel/toolbar chrome is themed with
`--pfd-color-*` custom properties, follows `prefers-color-scheme`, and can be forced per instance with
`data-pfd-theme="light|dark"`. Diagram **content** keeps the colours authored in the document, so it —
and exported SVG — is theme-invariant.

## Extending

The **properties-panel** feature is bundled here and re-exported (`propertiesPanelModule`,
`entryFactoryModule`, `pfdnPropertiesProviderModule`). Layer in custom engine modules — a feature, a
custom node-type drawer, an [icon pack](https://github.com/davcs86/d3-polytree/tree/main/packages/icons-amazon) —
through the `modules` constructor option (last definition wins, no subclassing):

```ts
import { Editor } from '@d3-polytree/editor';
import { awsIconsModule } from '@d3-polytree/icons-amazon';

new Editor({ container, modules: [awsIconsModule] });
```

See the Storybook
**[Guides/Kitchensink](https://davcs86.github.io/d3-polytree/?path=/story/guides-kitchensink--extending-the-library)**
story for a custom feature module, a custom node-type drawer, and the programmatic API end to end.

## Adapters

- [`@d3-polytree/element`](https://github.com/davcs86/d3-polytree/tree/main/packages/element) — the
  `<d3-polytree-editor>` custom element (shadow DOM, form-associated).
- [`@d3-polytree/react`](https://github.com/davcs86/d3-polytree/tree/main/packages/react) — the
  `<PolytreeEditor>` React wrapper.

Ships ESM + CJS + `.d.ts`, a self-contained UMD bundle (global `d3PolytreeEditor`), and compiled CSS
at `./style.css`.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
