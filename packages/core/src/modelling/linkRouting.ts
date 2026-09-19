import type { PfdnModdle } from '@d3-polytree/pfdn-moddle';
import type { Point } from '../draw';
import { avoidObstacles, type Obstacle, type RoutePoint } from '../route';
import type { ModellingModelElement } from './types';

/**
 * Pure link-routing geometry — no draw layer, no DI, no side effects on the
 * engine. Given a link and the full set of links (to distribute co-incident
 * connectors along a node side), it computes the orthogonal, edge-docked
 * waypoints for that link, reading node `position`/`size` straight from the
 * model.
 *
 * Extracted from `ModellingLinks` so the same math can run at three moments:
 *  - once over the whole model at load time ({@link routeLinks}, invoked from
 *    `loadModel`), so every component — including the static, modelling-less
 *    Viewer — renders links docked to node borders on first paint rather than as
 *    centre-to-centre straight lines;
 *  - on every `node.moved` / `node.updated` while editing (`ModellingLinks`
 *    delegates here), keeping drag re-routing behaviourally identical;
 *  - on link creation.
 */

/** A node position registered on one of the four sides of a node. */
interface SideEntry {
  obj: string;
  pos: Point;
}

/** A mutable {x, y} the routing math nudges in place. */
interface MutablePoint {
  x: number;
  y: number;
}

/** Side index carrier (which of the four node sides a waypoint attaches to). */
interface SideIndex {
  idx: number;
}

/** Beyond this axis distance a target connector flips to an orthogonal side. */
const SIDE_FLIP_THRESHOLD = 80;
/** Minimum axis gap before a straight run bends into a bezier. */
const CURVE_MIN_GAP = 20;

/**
 * Angle (radians) between two vectors. Guards the degenerate cases — a
 * zero-length vector, or a cosine that floats just past ±1 — that would make
 * `Math.acos` return `NaN` and give the sort comparator an undefined (and thus
 * non-deterministic) order. Determinism here is load-bearing: the waypoints must
 * be bit-identical between the load-time route and the interactive reroute so the
 * `toXML` round-trip stays byte-identical.
 */
function calculateAngle(a: Point, b: Point): number {
  const dotProduct = a.x * b.x + a.y * b.y;
  const moduleA = Math.sqrt(a.x ** 2 + a.y ** 2);
  const moduleB = Math.sqrt(b.x ** 2 + b.y ** 2);
  const denom = moduleA * moduleB;
  if (denom === 0) {
    return 0;
  }
  const ratio = Math.max(-1, Math.min(1, dotProduct / denom));
  return Math.acos(ratio);
}

/** Order the connectors on one node side by their angle to a reference. */
function sortSide(side: SideEntry[], sideIdx: number, s: Point): SideEntry[] {
  const vector: MutablePoint = { x: 1, y: 1 };
  let factor = 1.0;
  if (sideIdx === 0) {
    vector.x = -1.0;
  } else if (sideIdx === 1) {
    factor = -1.0;
  } else if (sideIdx === 2) {
    vector.y = -1.0;
    factor = -1.0;
  } else if (sideIdx === 3) {
    vector.x = -1.0;
    vector.y = -1.0;
  }
  return [...side].sort((o1, o2) => {
    const key = (o: SideEntry): number => {
      const vectorB: Point = { x: o.pos.x - s.x, y: o.pos.y - s.y };
      return factor * calculateAngle(vector, vectorB);
    };
    return key(o1) - key(o2);
  });
}

/** Assign a connector to a node side (quadrant) and re-sort that side. */
function setQuadrants(
  sides: SideEntry[][],
  s: Point,
  t: Point,
  toSave: string,
  isTarget: boolean
): void {
  let sideIdx: number | false = false;
  const dx = Math.abs(t.x - s.x);
  const dy = Math.abs(t.y - s.y);

  if (t.x >= s.x && t.y >= s.y) {
    if (dx >= dy) {
      sideIdx = 3;
      if (isTarget && dy > SIDE_FLIP_THRESHOLD) sideIdx = 0;
    } else {
      sideIdx = 0;
      if (isTarget && dx > SIDE_FLIP_THRESHOLD) sideIdx = 3;
    }
  } else if (t.x < s.x && t.y >= s.y) {
    if (dx >= dy) {
      sideIdx = 1;
      if (isTarget && dy > SIDE_FLIP_THRESHOLD) sideIdx = 0;
    } else {
      sideIdx = 0;
      if (isTarget && dx > SIDE_FLIP_THRESHOLD) sideIdx = 1;
    }
  } else if (t.x >= s.x && t.y < s.y) {
    if (dx >= dy) {
      sideIdx = 3;
      if (isTarget && dy > SIDE_FLIP_THRESHOLD) sideIdx = 2;
    } else {
      sideIdx = 2;
      if (isTarget && dx > SIDE_FLIP_THRESHOLD) sideIdx = 3;
    }
  } else if (t.x < s.x && t.y < s.y) {
    if (dx >= dy) {
      sideIdx = 1;
      if (isTarget && dy > SIDE_FLIP_THRESHOLD) sideIdx = 2;
    } else {
      sideIdx = 2;
      if (isTarget && dx > SIDE_FLIP_THRESHOLD) sideIdx = 1;
    }
  }

  if (sideIdx === false) {
    return;
  }
  sides[sideIdx].push({ obj: toSave, pos: s });
  sides[sideIdx] = sortSide(sides[sideIdx], sideIdx, t);
}

/**
 * Compute the four side buckets (quadrant assignment of every incident
 * connector) for a node, reading the incident links straight from `allLinks`.
 * `nodeIsTarget` mirrors the source-engine distinction: connectors arriving at
 * this node may flip to an orthogonal side past {@link SIDE_FLIP_THRESHOLD},
 * connectors leaving it never do.
 */
function computeSides(
  node: ModellingModelElement,
  allLinks: ModellingModelElement[],
  nodeIsTarget: boolean
): SideEntry[][] {
  const sides: SideEntry[][] = [[], [], [], []];
  const position = node.position as Point;

  allLinks.forEach((link) => {
    // predecessor: a link entering this node
    if (link.target === node) {
      const other = link.source as ModellingModelElement | undefined;
      if (other) {
        setQuadrants(sides, other.position as Point, position, other.id as string, nodeIsTarget);
      }
    }
    // successor: a link leaving this node
    if (link.source === node) {
      const other = link.target as ModellingModelElement | undefined;
      if (other) {
        setQuadrants(sides, other.position as Point, position, other.id as string, false);
      }
    }
  });

  return sides;
}

/**
 * Nudge `point` from a node's top-left corner out to the connector slot matching
 * `referencePoint` on its side, distributing multiple connectors evenly, and
 * record which side was used in `saveIndex`.
 */
function adjustSidePoint(
  point: MutablePoint,
  sides: SideEntry[][],
  referencePoint: string,
  elemSize: number,
  saveIndex: SideIndex
): void {
  let found = false;
  const size = elemSize * 1.0;
  sides.forEach((side, sideIdx) => {
    const sideLen = side.length;
    if (found || sideLen === 0) {
      return;
    }
    const distBtwArrows = (size * 0.8) / (sideLen + 1);
    let origin = size / 2.0 - (distBtwArrows * (sideLen + 1)) / 2;
    side.forEach((v) => {
      origin += distBtwArrows;
      if (v.obj === referencePoint) {
        saveIndex.idx = sideIdx;
        if (sideIdx === 0) {
          point.x += origin;
          point.y -= 5;
        } else if (sideIdx === 1) {
          point.x += size + 5;
          point.y += origin;
        } else if (sideIdx === 2) {
          point.x += origin;
          point.y += size + 5;
        } else if (sideIdx === 3) {
          point.x -= 5;
          point.y += origin;
        }
        found = true;
      }
    });
  });
}

/** Build a `pfdn:Coordinates` waypoint. */
function createWaypoint(moddle: PfdnModdle, x: number, y: number): Point {
  return moddle.create('pfdn:Coordinates', { x, y }) as unknown as Point;
}

/**
 * Compute the orthogonal, edge-docked waypoints for a single link. Returns
 * `null` when either endpoint is missing (a torn link), so callers can skip it
 * without throwing. Does not mutate the link.
 */
export function computeLinkWaypoints(
  link: ModellingModelElement,
  allLinks: ModellingModelElement[],
  nodes: ModellingModelElement[] | undefined,
  moddle: PfdnModdle
): Point[] | null {
  const source = link.source as ModellingModelElement | undefined;
  const target = link.target as ModellingModelElement | undefined;
  if (!source || !target) {
    return null;
  }

  const sourceSides = computeSides(source, allLinks, false);
  const targetSides = computeSides(target, allLinks, true);

  const sPos = source.position as Point;
  const tPos = target.position as Point;
  const sourcePoint: MutablePoint = { x: sPos.x, y: sPos.y };
  const targetPoint: MutablePoint = { x: tPos.x, y: tPos.y };
  const sourceSide: SideIndex = { idx: 0 };
  const targetSide: SideIndex = { idx: 0 };
  const plain: RoutePoint[] = [];
  let curve1RefPoint: MutablePoint | false = false;
  let curve2RefPoint: MutablePoint | false = false;

  adjustSidePoint(sourcePoint, sourceSides, target.id as string, source.size ?? 0, sourceSide);
  adjustSidePoint(targetPoint, targetSides, source.id as string, target.size ?? 0, targetSide);

  plain.push({ x: sourcePoint.x, y: sourcePoint.y });

  if (sourceSide.idx === 1 || sourceSide.idx === 3) {
    // source leaves from left or right
    if (targetSide.idx === 0 || targetSide.idx === 2) {
      // target arrives top or bottom → single elbow
      curve1RefPoint = { x: targetPoint.x, y: sourcePoint.y };
    } else if (Math.abs(sourcePoint.y - targetPoint.y) > CURVE_MIN_GAP) {
      const midPoint = {
        x: (targetPoint.x + sourcePoint.x) / 2,
        y: (targetPoint.y + sourcePoint.y) / 2
      };
      curve1RefPoint = { x: midPoint.x, y: sourcePoint.y };
      curve2RefPoint = { x: midPoint.x, y: targetPoint.y };
    }
  } else {
    // source leaves from top or bottom
    if (targetSide.idx === 1 || targetSide.idx === 3) {
      // target arrives left or right → single elbow
      curve1RefPoint = { x: sourcePoint.x, y: targetPoint.y };
    } else if (Math.abs(sourcePoint.x - targetPoint.x) > CURVE_MIN_GAP) {
      const midPoint = {
        x: (targetPoint.x + sourcePoint.x) / 2,
        y: (targetPoint.y + sourcePoint.y) / 2
      };
      curve1RefPoint = { x: sourcePoint.x, y: midPoint.y };
      curve2RefPoint = { x: targetPoint.x, y: midPoint.y };
    }
  }

  if (curve1RefPoint !== false) {
    plain.push({ x: curve1RefPoint.x, y: curve1RefPoint.y });
  }
  if (curve2RefPoint !== false) {
    plain.push({ x: curve2RefPoint.x, y: curve2RefPoint.y });
  }
  plain.push({ x: targetPoint.x, y: targetPoint.y });

  // Obstacle-avoidance post-pass (C4): nudge the elbow around the other nodes'
  // boxes, excluding this link's own two endpoints. Pure, deterministic, and a
  // no-op (returns the same array) when nothing is in the way — so a diagram with
  // clear channels routes exactly as before.
  const obstacles: Obstacle[] = (nodes ?? []).map((n) => {
    const pos = n.position as Point;
    return { id: n.id as string, x: pos.x, y: pos.y, size: n.size ?? 0 };
  });
  const routed = avoidObstacles(plain, obstacles, [source.id as string, target.id as string]);

  return routed.map((p) => createWaypoint(moddle, p.x, p.y));
}

/**
 * Route every link in the model in place, replacing each link's `waypoint`
 * array with edge-docked, orthogonal waypoints. Links whose endpoints are not
 * both present are left untouched. Called from `loadModel` so links render
 * correctly on first paint in every component, editor or not.
 */
export function routeLinks(
  links: ModellingModelElement[] | undefined,
  nodes: ModellingModelElement[] | undefined,
  moddle: PfdnModdle
): void {
  if (!links || links.length === 0) {
    return;
  }
  links.forEach((link) => {
    // A pinned link keeps its authored waypoints — the router never recomputes
    // it (C4). This is the load-time counterpart to the interactive skip, and it
    // is the ONLY router in the static Viewer / Interactive-Viewer / SSR tiers.
    if (link.get('pinned') === true) {
      return;
    }
    const waypoints = computeLinkWaypoints(link, links, nodes, moddle);
    if (waypoints) {
      link.waypoint = waypoints;
    }
  });
}
