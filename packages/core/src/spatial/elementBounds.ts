import type { Bounds } from './types';

type Pt = { x?: number; y?: number } | undefined;
interface Geometry {
  position?: Pt;
  size?: number;
  waypoint?: Pt[];
  lineWidth?: number;
  width?: number;
  height?: number;
  border?: { lineWidth?: number };
  fontSize?: number;
  text?: string;
}

/** Always visible: used whenever an input is missing or non-finite, so a bad def never hides. */
const EVERYWHERE: Bounds = {
  x0: -Infinity,
  y0: -Infinity,
  x1: Infinity,
  y1: Infinity
};

const everywhere = (): Bounds => ({ ...EVERYWHERE });
const ok = (...n: number[]): boolean => n.every((v) => Number.isFinite(v));

/** Conservative painted bounds (outline + paint overhang) in world units; design §2. */
export function elementBounds(kind: 'node' | 'link' | 'zone' | 'label', def: unknown): Bounds {
  // Direct property reads — never `.get()` on an isMany property (ledger 2026-09-20).
  const d = (def ?? {}) as Geometry;
  switch (kind) {
    case 'node': {
      const x = d.position?.x as number;
      const y = d.position?.y as number;
      const size = d.size as number;
      if (!ok(x, y, size)) return everywhere();
      return { x0: x - 3, y0: y - 3, x1: x + size + 9, y1: y + size + 9 };
    }
    case 'link': {
      const pts = d.waypoint;
      if (!pts || pts.length === 0) return everywhere();
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const p of pts) {
        const x = p?.x as number;
        const y = p?.y as number;
        if (!ok(x, y)) return everywhere();
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      const lw = d.lineWidth ?? 0;
      if (!ok(lw)) return everywhere();
      const m = 4.5 * lw + 2;
      return { x0: x0 - m, y0: y0 - m, x1: x1 + m, y1: y1 + m };
    }
    case 'zone': {
      const x = d.position?.x as number;
      const y = d.position?.y as number;
      const w = d.width as number;
      const h = d.height as number;
      const bw = d.border?.lineWidth ?? 0;
      if (!ok(x, y, w, h, bw)) return everywhere();
      const m = bw / 2;
      return { x0: x - m, y0: y - m, x1: x + w + m, y1: y + h + m };
    }
    case 'label': {
      const x = d.position?.x as number;
      const y = d.position?.y as number;
      const fs = d.fontSize ?? 13;
      if (!ok(x, y, fs)) return everywhere();
      const len = Math.max(1, (d.text ?? '').length);
      return {
        x0: x,
        y0: y,
        x1: x + len * fs * 1.2 + 3.66 + 6,
        y1: y + fs * 1.5 + 3.66 + 6
      };
    }
  }
}
