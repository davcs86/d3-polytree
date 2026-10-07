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
