import { describe, expect, it, vi } from 'vitest';
import { layout } from './layout';
import {
  decodeResult,
  encodeResult,
  handleLayoutRequest,
  type LayoutRequest,
  type LayoutResponse
} from './protocol';
import { WorkerLayoutRunner, type LayoutWorkerLike } from './runner';
import type { LayoutGraph } from './types';

const GRAPH: LayoutGraph = {
  nodes: [
    { id: 'a', width: 40, height: 40 },
    { id: 'b', width: 40, height: 40 }
  ],
  edges: [{ source: 'a', target: 'b' }]
};

describe('protocol', () => {
  it('round-trips a result through encode/decode', () => {
    const result = layout(GRAPH);
    const { order, buffer } = encodeResult(result);
    const back = decodeResult({
      type: 'polytree:layout:result',
      requestId: 1,
      order,
      positions: buffer,
      width: result.width,
      height: result.height
    });
    expect(back).toEqual(result);
  });

  it('handleLayoutRequest computes the same layout and marks the buffer transferable', () => {
    const { response, transfer } = handleLayoutRequest({
      type: 'polytree:layout',
      requestId: 7,
      graph: GRAPH
    });
    expect(response.requestId).toBe(7);
    expect(transfer).toEqual([response.positions]);
    expect(decodeResult(response)).toEqual(layout(GRAPH));
  });
});

describe('WorkerLayoutRunner', () => {
  it('correlates the response by requestId and resolves the layout', async () => {
    // A fake worker that answers on the same tick using the pure handler.
    let listener: ((event: MessageEvent<LayoutResponse>) => void) | null = null;
    const worker: LayoutWorkerLike = {
      addEventListener: (_type, l) => {
        listener = l;
      },
      removeEventListener: vi.fn(),
      postMessage: (message: LayoutRequest) => {
        const { response } = handleLayoutRequest(message);
        // deliver asynchronously, like a real worker
        queueMicrotask(() => listener?.({ data: response } as MessageEvent<LayoutResponse>));
      }
    };
    const runner = new WorkerLayoutRunner(worker);
    const result = await runner.run(GRAPH);
    expect(result).toEqual(layout(GRAPH));
    expect(worker.removeEventListener).toHaveBeenCalled();
  });

  it('ignores responses for other requestIds', async () => {
    let listener: ((event: MessageEvent<LayoutResponse>) => void) | null = null;
    const worker: LayoutWorkerLike = {
      addEventListener: (_type, l) => {
        listener = l;
      },
      removeEventListener: vi.fn(),
      postMessage: (message: LayoutRequest) => {
        // First deliver a stale/foreign response, then the real one.
        const stale: LayoutResponse = {
          type: 'polytree:layout:result',
          requestId: 999,
          order: [],
          positions: new Float64Array(0).buffer,
          width: 0,
          height: 0
        };
        const { response } = handleLayoutRequest(message);
        queueMicrotask(() => {
          listener?.({ data: stale } as MessageEvent<LayoutResponse>);
          listener?.({ data: response } as MessageEvent<LayoutResponse>);
        });
      }
    };
    const result = await new WorkerLayoutRunner(worker).run(GRAPH);
    expect(Object.keys(result.positions)).toHaveLength(2);
  });
});
