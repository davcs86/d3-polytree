import { expect, test } from '@playwright/test';
import {
  LARGE,
  SMALL,
  drawnElementCount,
  generateFixtureSpec,
  mulberry32
} from '../src/perf/fixture.data';

/**
 * Pure-data checks on the C10 fixture generator (Node only; no browser, no screenshots).
 * Determinism matters because the culling/perf expectations are computed from this data
 * independently of the engine.
 */
test.describe('perf fixture generator', () => {
  test('is deterministic per seed and differs across seeds', () => {
    const a = generateFixtureSpec({ ...SMALL, seed: 7 });
    const b = generateFixtureSpec({ ...SMALL, seed: 7 });
    const c = generateFixtureSpec({ ...SMALL, seed: 8 });
    expect(a).toEqual(b);
    expect(a.links.map((l) => l.target)).not.toEqual(c.links.map((l) => l.target));
  });

  test('mulberry32 yields floats in [0,1) and is repeatable', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = r1();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(v).toBe(r2());
    }
  });

  test('SMALL stays above 2x CULL_MIN_ELEMENTS (5,000)', () => {
    expect(drawnElementCount(generateFixtureSpec(SMALL))).toBeGreaterThanOrEqual(10_000);
  });

  test('LARGE matches the design shape: ~23k elements, 1:1.2 node:link, ~5% long-range', () => {
    const s = generateFixtureSpec(LARGE);
    expect(s.nodes).toHaveLength(10_000);
    expect(s.links).toHaveLength(12_000);
    expect(s.links.length / s.nodes.length).toBeCloseTo(1.2, 5);
    expect(s.zones).toHaveLength(40);
    expect(s.labels).toHaveLength(1_000);
    expect(drawnElementCount(s)).toBeGreaterThanOrEqual(23_000);
    const longFrac = s.links.filter((l) => l.longRange).length / s.links.length;
    expect(Math.abs(longFrac - 0.05)).toBeLessThan(0.01);
  });

  test('ids are unique and links reference real distinct nodes', () => {
    const s = generateFixtureSpec(SMALL);
    const ids = [...s.nodes, ...s.links, ...s.labels, ...s.zones].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const nodeIds = new Set(s.nodes.map((n) => n.id));
    for (const l of s.links) {
      expect(nodeIds.has(l.source)).toBe(true);
      expect(nodeIds.has(l.target)).toBe(true);
      expect(l.source).not.toBe(l.target);
      expect(l.waypoints.length).toBeGreaterThanOrEqual(2);
    }
  });
});
