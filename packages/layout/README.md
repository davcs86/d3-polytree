# @d3-polytree/layout

Framework-free **layered (Sugiyama) auto-layout** for [`d3-polytree`](https://github.com/davcs86/d3-polytree)
diagrams. Pure TypeScript — no DOM, no D3, no dependencies — so it is exactly
unit-testable on numeric fixtures and hostable in a Web Worker.

## Install

```sh
pnpm add @d3-polytree/layout
```

## Solver

```ts
import { layout } from '@d3-polytree/layout';

const result = layout(
  {
    nodes: [
      { id: 'a', width: 40, height: 40 },
      { id: 'b', width: 40, height: 40 },
      { id: 'c', width: 40, height: 40 }
    ],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'a', target: 'c' }
    ]
  },
  { direction: 'TB', nodeSpacing: 40, layerSpacing: 80 }
);

// result.positions -> { a: { x, y }, b: {…}, c: {…} }  (centre points)
// result.width / result.height -> overall extent
```

The pipeline is: cycle-break → longest-path layer assignment → dummy chains for
long edges → median + transpose crossing reduction → barycenter/isotonic
coordinate assignment. It is **deterministic**: the same graph and options always
yield the same coordinates.

`direction` is `'TB' | 'BT' | 'LR' | 'RL'`. See `LayoutOptions` for the tuning
knobs (`nodeSpacing`, `layerSpacing`, `margin`, `orderIterations`,
`coordIterations`) — all optional.

## Running off the main thread

The solver is pure, so it can run in a Web Worker. Point a `Worker` at the
`./worker` entry and drive it with `WorkerLayoutRunner`, which speaks a typed
`postMessage` protocol and reads back the positions as a **transferable
`Float64Array`** (zero-copy):

```ts
import { WorkerLayoutRunner } from '@d3-polytree/layout';

const worker = new Worker(new URL('@d3-polytree/layout/worker', import.meta.url), {
  type: 'module'
});
const runner = new WorkerLayoutRunner(worker);
const result = await runner.run(graph, { direction: 'LR' });
```

`createSyncLayoutRunner()` is the in-thread equivalent implementing the same
`LayoutRunner` interface — swap one for the other without changing calling code.

## In the editor

`@d3-polytree/editor` wires this in: `editor.autoLayout(options?)` re-lays the
whole diagram as a **single undoable command**, and the palette exposes an
"Auto-layout diagram" button. Provide a `layoutRunner` DI value to move it onto a
worker.

## License

MIT
