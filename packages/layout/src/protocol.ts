import { layout } from './layout';
import type { LayoutGraph, LayoutOptions, LayoutResult, Point } from './types';

/** Request posted to the layout worker. `order` fixes the node sequence the
 *  response buffer is packed in, so the transferable carries no keys. */
export interface LayoutRequest {
  type: 'polytree:layout';
  requestId: number;
  graph: LayoutGraph;
  options?: LayoutOptions;
}

/** Response from the worker: positions packed as a transferable Float64Array
 *  `[x0, y0, x1, y1, …]`, aligned to `order`. */
export interface LayoutResponse {
  type: 'polytree:layout:result';
  requestId: number;
  order: string[];
  positions: ArrayBuffer;
  width: number;
  height: number;
}

/** Pack a {@link LayoutResult} into an order array + transferable buffer. */
export function encodeResult(result: LayoutResult): { order: string[]; buffer: ArrayBuffer } {
  const order = Object.keys(result.positions);
  const array = new Float64Array(order.length * 2);
  order.forEach((id, i) => {
    array[i * 2] = result.positions[id].x;
    array[i * 2 + 1] = result.positions[id].y;
  });
  return { order, buffer: array.buffer };
}

/** Inverse of {@link encodeResult}. */
export function decodeResult(response: LayoutResponse): LayoutResult {
  const array = new Float64Array(response.positions);
  const positions: Record<string, Point> = {};
  response.order.forEach((id, i) => {
    positions[id] = { x: array[i * 2], y: array[i * 2 + 1] };
  });
  return { positions, width: response.width, height: response.height };
}

/**
 * Pure request→response handler. Kept free of any `self`/`Worker` reference so
 * it runs (and is tested) on the main thread too; the worker entry is just a
 * thin `onmessage` wrapper around it.
 */
export function handleLayoutRequest(request: LayoutRequest): {
  response: LayoutResponse;
  transfer: Transferable[];
} {
  const result = layout(request.graph, request.options);
  const { order, buffer } = encodeResult(result);
  return {
    response: {
      type: 'polytree:layout:result',
      requestId: request.requestId,
      order,
      positions: buffer,
      width: result.width,
      height: result.height
    },
    transfer: [buffer]
  };
}
