import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LayoutErrorResponse, LayoutRequest, LayoutResponse } from './protocol';
import { WorkerLayoutRunner, type LayoutWorkerLike } from './runner';

vi.mock('./layout', () => ({
  layout: () => {
    throw new TypeError('solver exploded');
  }
}));

type Scope = {
  onmessage: ((event: MessageEvent<LayoutRequest>) => void) | null;
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};

describe('layout worker entry', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts a polytree:layout:error response when the solver throws', async () => {
    const post = vi.fn();
    const scope: Scope = { onmessage: null, postMessage: post };
    vi.stubGlobal('self', scope);
    await import('./worker');
    scope.onmessage?.({
      data: { type: 'polytree:layout', requestId: 3, graph: { nodes: [], edges: [] } }
    } as unknown as MessageEvent<LayoutRequest>);
    expect(post).toHaveBeenCalledWith(
      {
        type: 'polytree:layout:error',
        requestId: 3,
        name: 'TypeError',
        message: 'solver exploded'
      },
      []
    );
  });

  it('WorkerLayoutRunner rejects with the reported error instead of timing out', async () => {
    let listener: ((event: MessageEvent<LayoutResponse | LayoutErrorResponse>) => void) | null =
      null;
    const worker: LayoutWorkerLike = {
      addEventListener: (_type, l) => {
        listener = l;
      },
      removeEventListener: vi.fn(),
      postMessage: (message: LayoutRequest) => {
        const error: LayoutErrorResponse = {
          type: 'polytree:layout:error',
          requestId: message.requestId,
          name: 'TypeError',
          message: 'solver exploded'
        };
        queueMicrotask(() => listener?.({ data: error } as MessageEvent<LayoutErrorResponse>));
      }
    };
    const run = new WorkerLayoutRunner(worker, 0).run({ nodes: [], edges: [] });
    await expect(run).rejects.toMatchObject({
      name: 'TypeError',
      message: 'WorkerLayoutRunner: solver exploded'
    });
    expect(worker.removeEventListener).toHaveBeenCalled();
  });
});
