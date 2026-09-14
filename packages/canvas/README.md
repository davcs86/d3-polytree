# @d3-polytree/canvas

Base SVG canvas toolbox for the d3-polytree v2 ecosystem — the diagram-js-style foundation the
viewer/editor build on.

Exports:

- **`Canvas`** — a `<div>`-wrapped `<svg>` with a root `<g>` layer; container/SVG/transform/size
  accessors and `canvas.init` / `canvas.resized` / `canvas.destroy` events on an injected event bus.
- **`ElementRegistry`** — id assignment (via `ids`) and an owned element store.
- **`ElementBuilder`** — assigns an id to a definition and runs a builder callback.
- **`getSvgString`** — serialize an `<svg>` with applicable CSS inlined (standalone export).
- **`canvasModule`** — a didi module descriptor wiring the above.

De-duplicated in Track B / B2 from `d3-canvas` and `core-v2beta`'s vendored `lib/base/core`; history
of `d3-canvas` is preserved in this package's git history. `d3-selection` is a peer dependency.

```ts
import EventEmitter from 'eventemitter3';
import { Canvas } from '@d3-polytree/canvas';

const bus = new EventEmitter();
const canvas = new Canvas({ container: host, width: 800, height: 600 }, bus);
bus.emit('d3canvas.init');
```
