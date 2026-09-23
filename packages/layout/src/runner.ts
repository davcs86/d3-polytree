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

  /**
   * @param _worker    the Worker to run layout on
   * @param _timeoutMs reject `run` if the worker does not answer within this many
   *                   ms (default 30000), so a crashed/hung worker never leaves the
   *                   promise pending forever. Pass `0` to disable the timeout.
   */
  constructor(
    private readonly _worker: LayoutWorkerLike,
    private readonly _timeoutMs = 30_000
  ) {}

  run(graph: LayoutGraph, options?: LayoutOptions): Promise<LayoutResult> {
    const requestId = (this._seq += 1);
    return new Promise<LayoutResult>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const cleanup = (): void => {
        this._worker.removeEventListener('message', onMessage);
        if (timer !== undefined) clearTimeout(timer);
      };
      const onMessage = (event: MessageEvent<LayoutResponse>): void => {
        const data = event.data;
        if (!data || data.type !== 'polytree:layout:result' || data.requestId !== requestId) {
          return;
        }
        cleanup();
        resolve(decodeResult(data));
      };
      this._worker.addEventListener('message', onMessage);
      if (this._timeoutMs > 0 && typeof setTimeout === 'function') {
        timer = setTimeout(() => {
          cleanup();
          reject(new Error(`WorkerLayoutRunner: layout timed out after ${this._timeoutMs}ms`));
        }, this._timeoutMs);
      }
      this._worker.postMessage({ type: 'polytree:layout', requestId, graph, options });
    });
  }

  /** Terminate the underlying worker, if it supports it. */
  dispose(): void {
    this._worker.terminate?.();
  }
}
