import { describe, expect, it } from 'vitest';
import { avoidObstacles, segmentIntersectsObstacle } from './obstacles';
import type { Obstacle, RoutePoint } from './types';

// A two-bend elbow with a vertical mid-channel at x=50: source docks on the
// right of a left node, target on the left of a right node, routed via x=50.
const elbow = (): RoutePoint[] => [
  { x: 20, y: 10 }, // source dock
  { x: 50, y: 10 }, // m1 (channel)
  { x: 50, y: 90 }, // m2 (channel)
  { x: 80, y: 90 } // target dock
];

describe('segmentIntersectsObstacle', () => {
  it('detects a vertical segment crossing a box', () => {
    const box: Obstacle = { id: 'o', x: 40, y: 40, size: 20 };
    expect(segmentIntersectsObstacle({ x: 50, y: 10 }, { x: 50, y: 90 }, box)).toBe(true);
  });
  it('reports no crossing for a segment clear of the box', () => {
    const box: Obstacle = { id: 'o', x: 200, y: 200, size: 20 };
    expect(segmentIntersectsObstacle({ x: 50, y: 10 }, { x: 50, y: 90 }, box)).toBe(false);
  });
});

describe('avoidObstacles', () => {
  it('returns the exact input when nothing is in the way (degradation invariant)', () => {
    const wp = elbow();
    const boxes: Obstacle[] = [{ id: 'far', x: 500, y: 500, size: 20 }];
    const out = avoidObstacles(wp, boxes, ['s', 't']);
    expect(out).toBe(wp); // same reference — untouched
  });

  it('shifts the mid-channel past an interposed obstacle', () => {
    const wp = elbow();
    const box: Obstacle = { id: 'mid', x: 40, y: 40, size: 20 }; // sits on the x=50 channel
    const out = avoidObstacles(wp, box ? [box] : [], ['s', 't']);
    expect(out).not.toBe(wp);
    // No segment of the result may cross the box.
    for (let i = 0; i < out.length - 1; i++) {
      expect(segmentIntersectsObstacle(out[i], out[i + 1], box)).toBe(false);
    }
    // The channel moved off x=50 (both mid points share the new x).
    expect(out[1].x).toBe(out[2].x);
    expect(out[1].x).not.toBe(50);
  });

  it('excludes endpoint nodes from obstacle consideration', () => {
    const wp = elbow();
    // A box exactly under the source dock, but named as an excluded endpoint.
    const box: Obstacle = { id: 's', x: 15, y: 5, size: 20 };
    const out = avoidObstacles(wp, [box], ['s', 't']);
    expect(out).toBe(wp); // excluded → not treated as an obstacle
  });

  it('is deterministic and independent of obstacle input order', () => {
    const boxesA: Obstacle[] = [
      { id: 'a', x: 40, y: 40, size: 20 },
      { id: 'b', x: 45, y: 30, size: 10 }
    ];
    const boxesB = [boxesA[1], boxesA[0]]; // reversed
    const out1 = avoidObstacles(elbow(), boxesA, ['s', 't']);
    const out2 = avoidObstacles(elbow(), boxesB, ['s', 't']);
    expect(out1).toEqual(out2);
  });

  it('gives up (returns input) and never throws when no shift clears the route', () => {
    const wp = elbow();
    // A wall of boxes spanning the whole plausible channel range.
    const wall: Obstacle[] = [];
    for (let x = -1000; x <= 1000; x += 5) {
      wall.push({ id: `w${x}`, x, y: 40, size: 20 });
    }
    const out = avoidObstacles(wp, wall, ['s', 't']);
    expect(out).toBe(wp); // graceful give-up
  });
});
