# @d3-polytree/canvas

Base **SVG canvas toolbox** for the [d3-polytree](https://github.com/davcs86/d3-polytree) v2
ecosystem — the diagram-js–style foundation the viewer, interactive-viewer, and editor are built on.
It owns the DOM surface (a `<div>`-wrapped `<svg>` with a root `<g>` layer), an id-assigning element
registry, a small element builder, and a standalone SVG-string exporter. Everything is wired as a
[didi](https://github.com/nikku/didi) module so it composes into the engine without any framework glue.

**[▶ Live demo](https://davcs86.github.io/d3-polytree/?path=/story/canvas-base--default)** in Storybook.

## Install

```sh
pnpm add @d3-polytree/canvas d3-selection
```

`d3-selection` is a **peer dependency** (D3 v7) — the canvas manipulates the DOM through it, so the
host application supplies the exact D3 slice it already uses. `eventemitter3` and `ids` are bundled
dependencies.

## What's inside

| Export | Kind | Role |
| --- | --- | --- |
| `Canvas` | class | The rendering surface: a container `<div>`, an `<svg>`, and a root `<g>`. Exposes container/SVG/transform/size accessors and emits `canvas.init` / `canvas.resized` / `canvas.destroy` on the injected event bus. |
| `ElementRegistry` | class | Id assignment (via [`ids`](https://github.com/bpmn-io/ids)) and an owned element store keyed by id. |
| `ElementBuilder` | class | Assigns an id to a definition and runs a builder callback that renders it. |
| `IdsIdGenerator`, `SequentialIdGenerator` | class | Pluggable id strategies — random (default) vs. deterministic sequential (`node_1`, `node_2`, …). |
| `getSvgString` | function | Serialize an `<svg>` to a standalone string with the applicable CSS inlined. |
| `canvasModule` | didi module | Descriptor wiring `Canvas` / `ElementRegistry` / `ElementBuilder` into an injector. |

Type exports: `ElementBuildFn`, `IdGenerator`, `DiagramEventMap`, `ElementClassName`, `MouseKind`.

## Usage

### Standalone

```ts
import EventEmitter from 'eventemitter3';
import { Canvas } from '@d3-polytree/canvas';

const bus = new EventEmitter();
const host = document.getElementById('app')!;
const canvas = new Canvas({ container: host, width: 800, height: 600 }, bus);

bus.emit('canvas.init');           // finish wiring the surface
const svg = canvas.getSVGStr();    // serialize (CSS inlined) for export/thumbnails
```

### Deterministic ids for reproducible output

```ts
import { SequentialIdGenerator, ElementRegistry } from '@d3-polytree/canvas';

// Sequential ids make serialized SVG byte-for-byte reproducible — the basis for
// the golden-file / SSR pipeline in @d3-polytree/ssr.
const registry = new ElementRegistry(new SequentialIdGenerator());
```

### As a didi module

```ts
import { canvasModule } from '@d3-polytree/canvas';
// compose canvasModule into a Diagram module list; downstream drawers resolve
// `canvas`, `elementRegistry`, and `elementBuilder` from the injector.
```

## Where it fits

`canvas` sits at the bottom of the dependency graph:

```
canvas + pfdn-moddle -> core -> viewer -> interactive-viewer -> editor
```

Most users consume it transitively through [`@d3-polytree/core`](https://github.com/davcs86/d3-polytree/tree/main/packages/core)
and a component; import it directly only when building a custom surface or a bespoke exporter.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
