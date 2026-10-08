# @d3-polytree/core

The diagram **engine** for the [d3-polytree](https://github.com/davcs86/d3-polytree) v2 ecosystem.
It wires the base canvas ([`@d3-polytree/canvas`](https://github.com/davcs86/d3-polytree/tree/main/packages/canvas))
and the PFDN model ([`@d3-polytree/pfdn-moddle`](https://github.com/davcs86/d3-polytree/tree/main/packages/pfdn-moddle))
into the [didi](https://github.com/nikku/didi) module stack the components build on, running on slim,
**modular D3 v7** peer dependencies.

Most applications consume the engine through a component
([`viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/viewer),
[`interactive-viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/interactive-viewer),
[`editor`](https://github.com/davcs86/d3-polytree/tree/main/packages/editor)) rather than directly —
but every drawer and feature is a didi module you can compose à la carte.

## Install

```sh
pnpm add @d3-polytree/core \
  d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag
```

The six **D3 v7 slices are peer dependencies** — the engine imports only the functions it needs and
lets the host own the D3 version. `@d3-polytree/canvas`, `@d3-polytree/layout`, and
`@d3-polytree/pfdn-moddle` come along as bundled workspace dependencies.

## What's inside

- **`draw/`** — the drawers (`nodes`, `links`, `labels`, `zones`), the icon loader + base icon set,
  markers, `<defs>`, and the `DrawingRegistry`. A node draws as a `<use>` of an SVG symbol keyed by
  its `type` (`iconLoader.symbolHref(type)`) and sized by its `size` attribute.
- **`model/`** — the model provider and settings normalisation (`loadModel`, `loadModelFromJson`,
  `emptyModel`, `ModelHost`).
- **`modelling/`** — the four element handlers and the create/save/delete orchestrator.
- **`features/*`** — pan/zoom, grid/axes, background, mouse events, selection, outline, drag, export,
  localStorage, upload, the palette (toolbar + add-handlers + link tool), resize, tooltip, and
  notifications — each a standalone didi module.

## Usage

### Boot the engine directly

```ts
import {
  Diagram,
  loadModel,
  nodesModule,
  linksModule,
  labelsModule,
  zonesModule
} from '@d3-polytree/core';

const host = await loadModel(pfdnXml); // { definitions, moddle }
const diagram = new Diagram({
  container: document.getElementById('app')!,
  modules: [
    labelsModule,
    zonesModule,
    linksModule,
    nodesModule,
    { d3polytree: ['value', host] } // drawers resolve the model off this token
  ]
});

const eventBus = diagram.get('eventBus');
eventBus.on('selection.changed', (prev, next) => console.log(next));
```

### Load from typed JSON

```ts
import { loadModelFromJson } from '@d3-polytree/core';
import { validate } from '@d3-polytree/pfdn-moddle';

if (validate(doc).ok) {
  const host = await loadModelFromJson(doc); // JSON twin of loadModel — throws on invalid input
}
```

## API

### Engine & model

| Export                                                      | Kind             | Description                                                                                                                          |
| ----------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Diagram`                                                   | class            | Bootstraps a didi injector from a module list; `get('<token>')` reaches any service.                                                 |
| `coreModules`                                               | `unknown[]`      | The base engine modules (canvas + drawing registry).                                                                                 |
| `loadModel`, `loadModelFromJson`, `emptyModel`              | function         | Load a `.pfdn` XML / typed JSON document (or an empty one) into a `ModelHost` (`{ definitions, moddle }`).                           |
| `ModelHost`                                                 | type             | The model host the drawers resolve off the `d3polytree` token.                                                                       |
| `buildModelGraph(input)`                                    | function         | Assembles a `LayoutGraph` from node/link definitions (`{ nodes, links, isLive, sizeOf? }`); shared by `autoLayout` and keyboard nav. |
| `ElementStatus`, `markModified`                             | const / function | The element status state machine.                                                                                                    |
| `nodesModule`, `linksModule`, `labelsModule`, `zonesModule` | didi module      | The drawers.                                                                                                                         |
| `createIcons`                                               | function         | The base icon set; icon packs spread it in their own `icons` factory.                                                                |

### Features

| Export                                                                                       | Kind        | Description                                                                                                                                         |
| -------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zoomModule`, `zoomScrollModule`, `axesModule`, `backgroundColorModule`, `mouseEventsModule` | didi module | Pan/zoom, scroll zoom, grid, background, and the DOM-to-bus mouse-event bridge.                                                                     |
| `selectionModule` / `Selection`                                                              | didi module | Selection tracking; emits `selection.changed`. A Ctrl (Windows/Linux) or Cmd (macOS) click adds to the selection, a plain click replaces it.        |
| `AdditiveModifiers`                                                                          | type        | `{ ctrlKey?, metaKey? }` — the modifier keys `Selection.select(element, definition, event?)` reads to add rather than replace.                      |
| `cullingModule` / `Culling`                                                                  | didi module | Viewport culling for large diagrams (default on, inert below `CULL_MIN_ELEMENTS` = 5,000 drawn elements). Compose it before the drawers.            |
| `outlineModule`, `dragModule`, `resizeElementModule`, `autoLayoutModule`, `paletteModule`    | didi module | Selection outline, dragging, resize handles, auto-layout, and the palette (toolbar + add-handlers + link tool).                                     |
| `keyboardNavModule` / `KeyboardNav`                                                          | didi module | Keyboard-first navigation: roving focus moved by arrow-key direction, a per-element focus ring, and an Escape hatch. Compose it before the drawers. |
| `ariaAnnouncerModule` / `AriaAnnouncer`                                                      | didi module | Announces selection and post-boot create/remove events through a visually hidden `aria-live="polite"` region.                                       |
| `exportingModule` / `Exporting`                                                              | didi module | `trigger(format)` downloads the diagram. `trigger('png')` rejects if the SVG cannot be rendered.                                                    |
| `ExportFormat`                                                                               | type        | `'pfdn' \| 'svg' \| 'png'`.                                                                                                                         |
| `uploadModule` / `Upload`                                                                    | didi module | Opens a `.pfdn` file from disk. A file that fails to import is reported through the `notifications` service, and the current diagram stays open.    |
| `localStorageModule` / `LocalStorage`, `readSavedDiagram()`                                  | didi module | Browser persistence (`save()`, `restore()`).                                                                                                        |

### Commands (undo/redo)

| Export                                                                                                                                | Kind        | Description                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commandStackModule` / `CommandStack`                                                                                                 | didi module | Transactional undo/redo: `execute(command, context, mergeKey?)`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `clear()`, `registerHandler()`.        |
| `CommandStack#markSaved()` / `isDirty()`                                                                                              | method      | Record the save point / ask whether the document differs from it. A `document.saved` bus event also calls `markSaved()`.                              |
| `CommandHandler`, `CommandContext`                                                                                                    | type        | The handler contract (`execute`/`revert`, optional `canExecute`, `preExecute`, `postExecute`, `merge`) and its serializable memento.                  |
| `registerModellingCommands(commandStack, handlers, definitions)`                                                                      | function    | Registers every modelling command on the stack (`element.create`, `element.delete`, `elements.delete`, `element.resize`, `element.move`, `link.pin`). |
| `createElementCommand`, `deleteElementCommand`, `deleteBatchCommand`, `resizeElementCommand`, `moveElementsCommand`, `pinLinkCommand` | function    | The individual `CommandHandler` factories behind those commands.                                                                                      |

**Failure semantics.** A failed `execute` is unwound (the commands it had already applied are reverted)
and the original error is rethrown; nothing is recorded. If that unwind also throws, a
`document.inconsistent` event is emitted first (its error carries `cause` = the original error and
`causes` = the unwind errors), and the stack stays live. If an `undo`/`redo` revert throws, the stack
is **quarantined** (disabled and cleared), `document.inconsistent` is emitted, and the error is
rethrown.

### Link routing

| Export                                             | Kind     | Description                                                                                                                                  |
| -------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `avoidObstacles(waypoints, obstacles, excludeIds)` | function | Pure obstacle-avoidance router (roadmap C4): nudges a four-point elbow's mid-channel around node boxes; other shapes are returned unchanged. |
| `segmentIntersectsObstacle`                        | function | The segment-vs-box test the router uses.                                                                                                     |
| `RoutePoint`, `Obstacle`                           | type     | `{ x, y }` and `{ id, x, y, size }`.                                                                                                         |

### Spatial index

| Export                                         | Kind         | Description                                                                                                    |
| ---------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- |
| `FlatIndex`, `SpatialIndex`                    | class / type | A pure, DOM-free rectangle index (`upsert` / `remove` / `scan`) behind a seam so a quadtree can replace it.    |
| `elementBounds(kind, def)`                     | function     | Conservative painted bounds of a node / link / zone / label in world units (always-visible when input is bad). |
| `CULL_MIN_ELEMENTS`, `CULL_PAD`, `HIDE_BUDGET` | const        | Culling activation threshold, viewport pad (world px) and per-frame hide budget.                               |
| `Bounds`                                       | type         | `{ x0, y0, x1, y1 }`.                                                                                          |

The package also exports a broad set of TypeScript types (`DiagramModule`, `DiagramEventMap`,
`CreateParameters`, `DrawingRegistry`, `LayoutOptions`, …) and re-exports the layout runners
(`createSyncLayoutRunner`, `WorkerLayoutRunner`). See
[`src/index.ts`](https://github.com/davcs86/d3-polytree/tree/main/packages/core/src/index.ts) for the full surface.

## Dependency injection (didi)

The engine is a module list, not a monolith. A module is a plain object —
`{ __init__: ['svc'], __depends__: [otherModule], svc: ['type'|'factory'|'value', X] }` — and two
invariants govern composition:

1. **Last definition of a token wins.** Composing a module _after_ the core modules overrides that
   token. This is the single extension seam: caller modules are appended after the component's own,
   and icon packs rely on it.
2. **Boot order = event-subscription order.** Drawers emit `<class>.created` (`node.created`,
   `link.created`, …) _during_ boot; any feature that must see those initial elements (selection,
   outline, search) has to be registered **before** the drawer modules.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/) — the component and Guides/Kitchensink
  stories exercise the engine end to end.

## License

MIT © David Castillo
