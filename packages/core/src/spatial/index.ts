/**
 * `@d3-polytree/core` spatial index (roadmap C10): a pure, DOM-free rectangle index plus the
 * per-class painted-bounds estimator used by viewport culling.
 */
export { FlatIndex } from './FlatIndex';
export { elementBounds } from './elementBounds';
export {
  CULL_MIN_ELEMENTS,
  CULL_PAD,
  HIDE_BUDGET,
  LOD_CLICK_TOL_PX,
  LOD_EXEMPT_CAP,
  LOD_NODE_PX,
  LOD_SCALE_OFF,
  LOD_SCALE_ON,
  MIN_LEGIBLE_PX
} from './types';
export type { Bounds, SpatialIndex } from './types';
