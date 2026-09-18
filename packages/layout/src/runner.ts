import { layout } from './layout';
import { decodeResult, type LayoutRequest, type LayoutResponse } from './protocol';
import type { LayoutGraph, LayoutOptions, LayoutResult } from './types';

/**
 * An async layout provider. Lets a consumer swap the pure in-thread solver for
 * an off-main-thread Worker without any other code changing — the core
 * auto-layout feature depends on this interface, not on `layout` directly.
 */
export interface LayoutRunner {
  run(graph: LayoutGraph, options?: LayoutOptions): Promise<LayoutResult>;
}

/** The default runner: runs the pure solver synchronously, wrapped in a promise. */
export function createSyncLayoutRunner(): LayoutRunner {
  return { run: (graph, options) => Promise.resolve(layout(graph, options)) };
}

/** The subset of the DOM `Worker` API {@link WorkerLayoutRunner} needs. */
export interface LayoutWorkerLike {
  postMessage(message: LayoutRequest, transfer?: Transferable[]): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<LayoutResponse>) => void): void;
  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent<LayoutResponse>) => void
  ): void;
  terminate?(): void;
}

/**
 * Runs layout on a Web Worker built from `@d3-polytree/layout/worker`.
 * Correlates responses by `requestId`, so concurrent calls on one worker never
 * cross-wire, and reads back the transferable position buffer.
 */
export class WorkerLayoutRunner implements LayoutRunner {
  private _seq = 0;

  constructor(private readonly _worker: LayoutWorkerLike) {}

  run(graph: LayoutGraph, options?: LayoutOptions): Promise<LayoutResult> {
    const requestId = (this._seq += 1);
    return new Promise<LayoutResult>((resolve) => {
      const onMessage = (event: MessageEvent<LayoutResponse>): void => {
        const data = event.data;
        if (!data || data.type !== 'polytree:layout:result' || data.requestId !== requestId) {
          return;
        }
        this._worker.removeEventListener('message', onMessage);
        resolve(decodeResult(data));
      };
      this._worker.addEventListener('message', onMessage);
      this._worker.postMessage({ type: 'polytree:layout', requestId, graph, options });
    });
  }

  /** Terminate the underlying worker, if it supports it. */
  dispose(): void {
    this._worker.terminate?.();
  }
}
