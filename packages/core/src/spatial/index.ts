/**
 * `@d3-polytree/core` spatial index (roadmap C10): a pure, DOM-free rectangle index plus the
 * per-class painted-bounds estimator used by viewport culling.
 */
export { FlatIndex } from './FlatIndex';
export { elementBounds } from './elementBounds';
export { CULL_MIN_ELEMENTS, CULL_PAD, HIDE_BUDGET } from './types';
export type { Bounds, SpatialIndex } from './types';
