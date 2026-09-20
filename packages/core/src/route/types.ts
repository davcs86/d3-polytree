/**
 * Pure geometry types for the obstacle-avoidance router. No moddle, no DOM, no
 * DI — plain numbers only, so the router is fixture-testable in isolation and a
 * future Worker offload (C10) is a mechanical extraction.
 */

/** A plain 2-D point. */
export interface RoutePoint {
  x: number;
  y: number;
}

/**
 * A rectangular obstacle: a node's axis-aligned bounding box. `x`/`y` is the
 * top-left corner and `size` the square side (matching `pfdn:Node` geometry —
 * `position` top-left, scalar `size`). `id` gives a stable, deterministic
 * ordering key.
 */
export interface Obstacle {
  id: string;
  x: number;
  y: number;
  size: number;
}
