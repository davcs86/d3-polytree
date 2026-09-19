import { handleLayoutRequest, type LayoutRequest } from './protocol';

/**
 * Web Worker entry point (`@d3-polytree/layout/worker`). Runs the pure solver
 * off the main thread and posts the result back with the position buffer marked
 * transferable (zero-copy). Consumers instantiate it with
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
    const { response, transfer } = handleLayoutRequest(data);
    self.postMessage(response, transfer);
  };
}
