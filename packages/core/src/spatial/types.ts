/** Axis-aligned world-space rectangle. */
export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * A rectangle index over element bounds. The seam exists so a quadtree can replace the flat scan
 * without touching `Culling` (C10 design §3). Slots are small integers, stable while an id is live.
 */
export interface SpatialIndex {
  upsert(id: string, b: Bounds): number;
  remove(id: string): void;
  /** Visits every live slot in ascending slot order; `inside` = its bounds intersect `rect`. */
  scan(rect: Bounds, visit: (slot: number, inside: boolean) => void): void;
}

/**
 * Culling stays inert below this many drawn elements: unculled panning holds one 60 Hz frame up
 * to ~4.6k elements and first degrades at ~9.2k (`measurements.md` §3).
 * @internal
 */
export const CULL_MIN_ELEMENTS = 5000;

/**
 * World-unit margin added around the viewport: `ceil(max per-class painted overhang 6) + 1`
 * (`measurements.md` §5); provisional until the G1 gate confirms it.
 * @internal
 */
export const CULL_PAD = 7;

/**
 * Maximum hide writes per animation frame: ≈ 300 toggles ≈ 20–33 ms at the measured 65–110 µs per
 * toggled element (`measurements.md` §2). Shows are unbounded (correctness).
 * @internal
 */
export const HIDE_BUDGET = 300;

/**
 * Nominal node size in world units (the moddle `size` default) used to turn a legibility floor in
 * screen pixels into a zoom scale (`lod-measurements.md`; provisional).
 * @internal
 */
export const LOD_NODE_PX = 25;

/**
 * A node narrower than this many screen pixels is illegible; below it LOD holds nodes and links.
 * @internal
 */
export const MIN_LEGIBLE_PX = 4;

/**
 * Zoom scale at or below which zoom-out LOD turns ON (`MIN_LEGIBLE_PX / LOD_NODE_PX` = 0.16).
 * @internal
 */
export const LOD_SCALE_ON = MIN_LEGIBLE_PX / LOD_NODE_PX;

/**
 * Zoom scale above which LOD turns OFF; one pixel of hysteresis above {@link LOD_SCALE_ON}
 * (0.20) so the band does not thrash.
 * @internal
 */
export const LOD_SCALE_OFF = (MIN_LEGIBLE_PX + 1) / LOD_NODE_PX;

/**
 * Most selected elements LOD keeps painted (first N in ascending slot order, sticky); bounds the
 * exempt set so a select-all cannot defeat the optimisation.
 * @internal
 */
export const LOD_EXEMPT_CAP = 200;

/**
 * Click tolerance, in screen pixels, when the resolver hit-tests a held (hidden) node or link.
 * @internal
 */
export const LOD_CLICK_TOL_PX = 4;
