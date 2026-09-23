# @d3-polytree/layout

Framework-free **layered (Sugiyama) auto-layout** for process-flow diagrams. Part of the
[d3-polytree](https://github.com/davcs86/d3-polytree) ecosystem — the pure solver behind
[`@d3-polytree/core`](https://github.com/davcs86/d3-polytree/tree/main/packages/core)'s `autoLayout`
feature. Pure TypeScript — **no DOM, no D3, no dependencies** — so it is unit-testable on numeric
fixtures and hostable in a Web Worker.

## Install

```sh
pnpm add @d3-polytree/layout
```

**No peer dependencies** — the solver is pure and runs anywhere: the browser main thread, a Web
Worker, or Node.

## What's inside

| Export                                                         | Kind     | Role                                                                                                     |
| -------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `layout`                                                       | function | Run the solver synchronously: `LayoutGraph` + `LayoutOptions` → `LayoutResult` (centre points + extent). |
| `createSyncLayoutRunner`                                       | function | The in-thread `LayoutRunner` — wraps `layout` in a promise.                                              |
| `WorkerLayoutRunner`                                           | class    | A `LayoutRunner` that drives the `./worker` entry over a typed, transferable `postMessage` protocol.     |
| `LayoutGraph` · `LayoutNode` · `LayoutEdge`                    | type     | The input graph (unique node ids; `width`/`height` bounding boxes).                                      |
| `LayoutOptions` · `LayoutResult` · `LayoutDirection` · `Point` | type     | Tuning knobs and output.                                                                                 |
| `DEFAULT_OPTIONS`                                              | value    | The resolved defaults applied to `LayoutOptions`.                                                        |
| `LayoutRunner` · `LayoutWorkerLike`                            | type     | The runner interface and the minimal Worker surface it needs.                                            |

The Web Worker entry is published separately at `@d3-polytree/layout/worker`.

## Usage

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

The pipeline is: cycle-break → longest-path layer assignment → dummy chains for long edges → median +
transpose crossing reduction → barycenter/isotonic coordinate assignment. It is **deterministic**: the
same graph and options always yield the same coordinates.

### Running off the main thread

The solver is pure, so it can run in a Web Worker. Point a `Worker` at the `./worker` entry and drive
it with `WorkerLayoutRunner`, which speaks a typed `postMessage` protocol and reads back the positions
as a **transferable `Float64Array`** (zero-copy):

```ts
import { WorkerLayoutRunner } from '@d3-polytree/layout';

const worker = new Worker(new URL('@d3-polytree/layout/worker', import.meta.url), {
  type: 'module'
});
const runner = new WorkerLayoutRunner(worker); // optional 2nd arg: timeout ms (default 30000)
const result = await runner.run(graph, { direction: 'LR' });
```

`createSyncLayoutRunner()` is the in-thread equivalent implementing the same `LayoutRunner` interface —
swap one for the other without changing calling code.

## API

`layout(graph, options?)` returns a `LayoutResult` of **centre** points per input node id. `options`
(`LayoutOptions`) — every field is optional, and out-of-range values are clamped to sane minimums:

| Option            | Type                           | Default | Description                                          |
| ----------------- | ------------------------------ | ------- | ---------------------------------------------------- |
| `direction`       | `'TB' \| 'BT' \| 'LR' \| 'RL'` | `'TB'`  | Flow direction.                                      |
| `nodeSpacing`     | `number`                       | `40`    | Minimum gap between two nodes in the same layer.     |
| `layerSpacing`    | `number`                       | `80`    | Gap between adjacent layers.                         |
| `margin`          | `number`                       | `20`    | Padding around the whole result.                     |
| `orderIterations` | `number`                       | `24`    | Crossing-reduction sweeps (higher = better, slower). |
| `coordIterations` | `number`                       | `12`    | Coordinate-alignment sweeps.                         |

`WorkerLayoutRunner(worker, timeoutMs = 30000)` — `run()` rejects if the worker does not answer within
`timeoutMs` (pass `0` to disable), so a crashed worker never leaves the promise pending.

## Where it fits

`@d3-polytree/editor` wires this in: `editor.autoLayout(options?)` re-lays the whole diagram as a
**single undoable command**, and the palette exposes an "Auto-layout diagram" button. Provide a
`layoutRunner` DI value to move it onto a worker.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
