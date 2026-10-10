import { describe, expect, it } from 'vitest';
import { FlatIndex } from './FlatIndex';
import { elementBounds } from './elementBounds';
import {
  CULL_MIN_ELEMENTS,
  CULL_PAD,
  HIDE_BUDGET,
  LOD_CLICK_TOL_PX,
  LOD_EXEMPT_CAP,
  LOD_NODE_PX,
  LOD_SCALE_OFF,
  LOD_SCALE_ON,
  MIN_LEGIBLE_PX,
  type Bounds
} from './types';

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hits = (a: Bounds, r: Bounds) => a.x0 <= r.x1 && a.x1 >= r.x0 && a.y0 <= r.y1 && a.y1 >= r.y0;

describe('FlatIndex', () => {
  it('scan equals a brute-force intersect on a seeded random set', () => {
    const rnd = mulberry32(7);
    const idx = new FlatIndex();
    const all: Bounds[] = [];
    for (let i = 0; i < 300; i++) {
      const x = rnd() * 1000;
      const y = rnd() * 1000;
      const b = { x0: x, y0: y, x1: x + rnd() * 80, y1: y + rnd() * 80 };
      all.push(b);
      idx.upsert(`e${i}`, b);
    }
    for (let q = 0; q < 20; q++) {
      const x = rnd() * 900;
      const y = rnd() * 900;
      const rect = { x0: x, y0: y, x1: x + 200, y1: y + 150 };
      const got: number[] = [];
      idx.scan(rect, (s, inside) => {
        if (inside) got.push(s);
      });
      const want = all.flatMap((b, i) => (hits(b, rect) ? [i] : []));
      expect(got).toEqual(want);
    }
  });

  it('returns a stable slot for a live id; a removed slot is reused by the next new id', () => {
    const idx = new FlatIndex();
    const b = { x0: 0, y0: 0, x1: 1, y1: 1 };
    const s = idx.upsert('a', b);
    expect(idx.upsert('a', { x0: 5, y0: 5, x1: 6, y1: 6 })).toBe(s);
    idx.remove('a');
    expect(idx.upsert('b', b)).toBe(s); // freed slot reused, no growth
    expect(idx.capacity).toBe(1);
    expect(idx.upsert('a', b)).not.toBe(s); // the old id gets a fresh slot
  });

  it('skips removed slots, visits ascending, and tolerates unknown ids', () => {
    const idx = new FlatIndex();
    const b = { x0: 0, y0: 0, x1: 1, y1: 1 };
    idx.upsert('a', b);
    idx.upsert('b', b);
    idx.upsert('c', b);
    idx.remove('b');
    idx.remove('nope');
    const seen: number[] = [];
    idx.scan({ x0: -1, y0: -1, x1: 2, y1: 2 }, (s) => seen.push(s));
    expect(seen).toEqual([0, 2]);
  });

  it('grows beyond its initial capacity', () => {
    const idx = new FlatIndex();
    for (let i = 0; i < 1000; i++) idx.upsert(`e${i}`, { x0: i, y0: 0, x1: i + 1, y1: 1 });
    const inside: number[] = [];
    idx.scan({ x0: 500, y0: 0, x1: 500, y1: 1 }, (s, i) => i && inside.push(s));
    expect(inside).toEqual([499, 500]);
  });

  it('treats infinite bounds as always inside', () => {
    const idx = new FlatIndex();
    idx.upsert('a', { x0: -Infinity, y0: -Infinity, x1: Infinity, y1: Infinity });
    let inside = false;
    idx.scan({ x0: 5, y0: 5, x1: 6, y1: 6 }, (_s, i) => (inside = i));
    expect(inside).toBe(true);
  });

  it('bounds capacity under churn (free-list): capacity tracks the peak live count', () => {
    const live = 5000;
    const idx = new FlatIndex();
    for (let i = 0; i < live; i++) idx.upsert(`c0_${i}`, { x0: i, y0: 0, x1: i + 1, y1: 1 });
    for (let c = 1; c <= 10; c++) {
      for (let i = 0; i < live; i++) idx.remove(`c${c - 1}_${i}`);
      for (let i = 0; i < live; i++) idx.upsert(`c${c}_${i}`, { x0: i, y0: 0, x1: i + 1, y1: 1 });
    }
    expect(idx.capacity).toBe(live);
    let seen = 0;
    idx.scan({ x0: 0, y0: 0, x1: live, y1: 1 }, () => seen++);
    expect(seen).toBe(live);
  });
});

describe('elementBounds', () => {
  const pt = (x: number, y: number) => ({ x, y });

  it('node: [x-3, x+size+9]', () => {
    expect(elementBounds('node', { position: pt(10, 20), size: 25 })).toEqual({
      x0: 7,
      y0: 17,
      x1: 44,
      y1: 54
    });
  });

  it('link: waypoint AABB inflated by 4.5*lineWidth+2', () => {
    const b = elementBounds('link', { waypoint: [pt(0, 0), pt(100, 50)], lineWidth: 4 });
    expect(b).toEqual({ x0: -20, y0: -20, x1: 120, y1: 70 });
  });

  it('zone: inflated by half the border width', () => {
    expect(
      elementBounds('zone', {
        position: pt(0, 0),
        width: 100,
        height: 50,
        border: { lineWidth: 4 }
      })
    ).toEqual({ x0: -2, y0: -2, x1: 102, y1: 52 });
  });

  it('label: estimator is monotone in fontSize and text length', () => {
    const w = (text: string, fontSize: number) => {
      const b = elementBounds('label', { position: pt(0, 0), text, fontSize });
      return [b.x1 - b.x0, b.y1 - b.y0];
    };
    expect(w('abcd', 12)[0]).toBeGreaterThan(w('ab', 12)[0]);
    expect(w('ab', 20)[0]).toBeGreaterThan(w('ab', 12)[0]);
    expect(w('ab', 20)[1]).toBeGreaterThan(w('ab', 12)[1]);
    expect(w('', 12)[0]).toBe(w('a', 12)[0]);
  });

  it.each([
    ['node', {}],
    ['node', { position: pt(NaN, 0), size: 25 }],
    ['link', { waypoint: [] }],
    ['link', { waypoint: [pt(0, Infinity)] }],
    ['zone', { position: pt(0, 0) }],
    ['label', { position: pt(0, NaN) }],
    ['label', undefined]
  ] as const)('%s with missing/non-finite input is always visible', (kind, def) => {
    expect(elementBounds(kind, def)).toEqual({
      x0: -Infinity,
      y0: -Infinity,
      x1: Infinity,
      y1: Infinity
    });
  });
});

describe('culling constants', () => {
  it('equal the measured values (change ⇒ update measurements.md)', () => {
    expect(CULL_MIN_ELEMENTS).toBe(5000);
    expect(CULL_PAD).toBe(7);
    expect(HIDE_BUDGET).toBe(300);
  });

  it('LOD constants equal the recorded values (change ⇒ update lod-measurements.md)', () => {
    expect(LOD_NODE_PX).toBe(25);
    expect(MIN_LEGIBLE_PX).toBe(4);
    expect(LOD_SCALE_ON).toBeCloseTo(0.16, 10);
    expect(LOD_SCALE_OFF).toBeCloseTo(0.2, 10);
    expect(LOD_SCALE_OFF).toBeGreaterThan(LOD_SCALE_ON);
    expect(LOD_EXEMPT_CAP).toBe(200);
    expect(LOD_CLICK_TOL_PX).toBe(4);
  });
});
