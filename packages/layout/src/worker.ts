import { encodeError, handleLayoutRequest, type LayoutRequest } from './protocol';

/**
 * Web Worker entry point (`@d3-polytree/layout/worker`). Runs the pure solver
 * off the main thread and posts the result back with the position buffer marked
 * transferable (zero-copy); a solver failure is posted back as a
 * `polytree:layout:error` response. Consumers instantiate it with
 * `new Worker(new URL('@d3-polytree/layout/worker', import.meta.url), { type: 'module' })`
 * and drive it through {@link WorkerLayoutRunner}.
 */
declare const self: {
  onmessage: ((event: MessageEvent<LayoutRequest>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
};

if (typeof self !== 'undefined') {
  self.onmessage = (event: MessageEvent<LayoutRequest>): void => {
    const data = event.data;
    if (!data || data.type !== 'polytree:layout') {
      return;
    }
    let handled: ReturnType<typeof handleLayoutRequest>;
    try {
      handled = handleLayoutRequest(data);
    } catch (error) {
      // report the solver failure; otherwise the runner only sees a timeout
      self.postMessage(encodeError(data.requestId, error), []);
      return;
    }
    self.postMessage(handled.response, handled.transfer);
  };
}
