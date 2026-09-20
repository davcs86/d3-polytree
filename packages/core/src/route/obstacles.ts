/**
 * Obstacle-avoiding orthogonal routing — a bounded, deterministic post-pass over
 * an already-computed elbow polyline. It shifts the shared mid-channel of a
 * two-bend elbow past any node it crosses; when it cannot clear the route within
 * a small attempt budget it **gives up** and returns the elbow unchanged
 * (accepting the crossing). It never loops unboundedly and never throws.
 *
 * Design invariants (roadmap C4, design doc §Chosen Approach):
 *  - **Degrades to the exact input** when no segment intersects an obstacle — so
 *    diagrams with clear channels render identically to the pre-C4 router.
 *  - **Deterministic**: obstacles are consumed in id-sorted order, candidate
 *    shifts are integer-quantized, and ties break by a total order — no
 *    `Math.random`, no `Date`, no Set/Map iteration-order dependence.
 *  - **Pure**: no DOM, no D3, no moddle; plain numbers in and out.
 */
import type { Obstacle, RoutePoint } from './types';

/** Clearance kept between a rerouted segment and an obstacle edge. */
const MARGIN = 15;
/** Maximum shift candidates tried per route before giving up. */
const MAX_ATTEMPTS = 8;

/** Integer-quantize a coordinate so tie-breaks never hinge on float equality. */
function q(n: number): number {
  return Math.round(n);
}

/**
 * Does the axis-aligned segment `a`→`b` intersect `box` (expanded by `margin`)?
 * Elbow segments are always horizontal or vertical; a diagonal fallback keeps
 * the test total.
 */
export function segmentIntersectsObstacle(
  a: RoutePoint,
  b: RoutePoint,
  box: Obstacle,
  margin = 0
): boolean {
  const minX = box.x - margin;
  const maxX = box.x + box.size + margin;
  const minY = box.y - margin;
  const maxY = box.y + box.size + margin;

  if (a.y === b.y) {
    const y = a.y;
    if (y < minY || y > maxY) return false;
    const lo = Math.min(a.x, b.x);
    const hi = Math.max(a.x, b.x);
    return hi >= minX && lo <= maxX;
  }
  if (a.x === b.x) {
    const x = a.x;
    if (x < minX || x > maxX) return false;
    const lo = Math.min(a.y, b.y);
    const hi = Math.max(a.y, b.y);
    return hi >= minY && lo <= maxY;
  }
  // Diagonal (not produced by the elbow router): bounding-box overlap.
  const loX = Math.min(a.x, b.x);
  const hiX = Math.max(a.x, b.x);
  const loY = Math.min(a.y, b.y);
  const hiY = Math.max(a.y, b.y);
  return hiX >= minX && loX <= maxX && hiY >= minY && loY <= maxY;
}

/** True if any consecutive segment of `pts` intersects any obstacle in `boxes`. */
function anySegmentBlocked(pts: RoutePoint[], boxes: Obstacle[]): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    for (const box of boxes) {
      if (segmentIntersectsObstacle(pts[i], pts[i + 1], box)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Route `waypoints` around `obstacles`, excluding the endpoint nodes (whose boxes
 * the link legitimately docks against). Returns a new array when a clearing shift
 * is found, otherwise the input array unchanged (identity when already clear, or
 * a graceful give-up when no shift clears the route).
 *
 * Only the classic four-point elbow (source, m1, m2, target) with a single shared
 * mid-channel is nudged — shifting the channel coordinate keeps every segment
 * orthogonal. Other shapes (straight, single-elbow) are returned unchanged; a
 * crossing there is accepted (best-effort, per the design's give-up floor).
 */
export function avoidObstacles(
  waypoints: RoutePoint[],
  obstacles: Obstacle[],
  excludeIds: readonly string[]
): RoutePoint[] {
  const exclude = new Set(excludeIds);
  const boxes = obstacles
    .filter((o) => !exclude.has(o.id))
    .slice()
    .sort((p, r) => (p.id < r.id ? -1 : p.id > r.id ? 1 : 0));

  if (boxes.length === 0 || !anySegmentBlocked(waypoints, boxes)) {
    return waypoints; // nothing in the way → exact-output degradation
  }
  if (waypoints.length !== 4) {
    return waypoints; // only the two-bend elbow is channel-nudgeable → give up
  }

  const [s, m1, m2, t] = waypoints;
  // Identify the shared mid-channel axis (kept orthogonal by shifting it).
  const axis: 'x' | 'y' | null = m1.x === m2.x ? 'x' : m1.y === m2.y ? 'y' : null;
  if (axis === null) {
    return waypoints;
  }
  const current = m1[axis];

  // Candidate channel coordinates: just past each blocking box edge (both sides).
  const candidates: number[] = [];
  const lo = axis === 'x' ? 'x' : 'y';
  for (const box of boxes) {
    const near = box[lo] - MARGIN;
    const far = box[lo] + box.size + MARGIN;
    candidates.push(q(near), q(far));
  }
  // Deterministic total order: nearest shift first, then sign, then value.
  const ordered = candidates
    .filter((c) => c !== current)
    .sort((p, r) => {
      const dp = Math.abs(p - current);
      const dr = Math.abs(r - current);
      if (dp !== dr) return dp - dr;
      const sp = Math.sign(p - current);
      const sr = Math.sign(r - current);
      if (sp !== sr) return sp - sr;
      return p - r;
    });

  let tried = 0;
  const seen = new Set<number>();
  for (const c of ordered) {
    if (seen.has(c)) continue;
    seen.add(c);
    if (tried++ >= MAX_ATTEMPTS) break;
    const nm1: RoutePoint = { x: m1.x, y: m1.y };
    const nm2: RoutePoint = { x: m2.x, y: m2.y };
    nm1[axis] = c;
    nm2[axis] = c;
    const candidate = [s, nm1, nm2, t];
    if (!anySegmentBlocked(candidate, boxes)) {
      return candidate;
    }
  }
  return waypoints; // give up → accept the crossing (never throws, never loops)
}
