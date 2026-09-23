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

## Key exports

`Diagram`, `coreModules`, `loadModel`, `loadModelFromJson`, `emptyModel`, `ModelHost`; the drawer
modules (`nodesModule`, `linksModule`, `labelsModule`, `zonesModule`); the feature modules
(`zoomModule`, `zoomScrollModule`, `axesModule`, `backgroundColorModule`, `mouseEventsModule`,
`selectionModule`, `outlineModule`, `dragModule`, `exportingModule`, `localStorageModule`,
`uploadModule`, `paletteModule`, `resizeElementModule`, `autoLayoutModule`, …); `createIcons` and the
icon-pack convention; plus a broad set of TypeScript types (`DiagramModule`, `DiagramEventMap`,
`CreateParameters`, `CommandStack`, `Selection`, `DrawingRegistry`, `LayoutOptions`, …).

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/) — the component and Guides/Kitchensink
  stories exercise the engine end to end.

## License

MIT © David Castillo
