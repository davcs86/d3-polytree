/**
 * `@d3-polytree/layout` — framework-free layered (Sugiyama) auto-layout.
 *
 * The default export surface is the pure {@link layout} solver plus the runner
 * abstraction. The Web Worker entry lives at `@d3-polytree/layout/worker`.
 */
export { layout } from './layout';
export {
  type LayoutDirection,
  type LayoutNode,
  type LayoutEdge,
  type LayoutGraph,
  type LayoutOptions,
  type LayoutResult,
  type Point,
  DEFAULT_OPTIONS
} from './types';
export {
  type LayoutRequest,
  type LayoutResponse,
  encodeResult,
  decodeResult,
  handleLayoutRequest
} from './protocol';
export {
  type LayoutRunner,
  type LayoutWorkerLike,
  createSyncLayoutRunner,
  WorkerLayoutRunner
} from './runner';
