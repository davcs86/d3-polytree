/**
 * Seeded, deterministic fixture generator for the C10 culling/perf harnesses.
 *
 * Pure data only — zero imports from `@d3-polytree/*` — so Playwright specs (Node) can
 * import it to compute expectations independently of the engine. The browser-side XML
 * builder lives in `fixture.xml.ts`. No `Math.random`/`Date` (PLAT-06): the same options
 * always yield byte-identical output.
 */

/** Tiny seeded PRNG (mulberry32). Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Pt {
  x: number;
  y: number;
}
export interface FixtureNode {
  id: string;
  x: number;
  y: number;
  size: number;
  /** Id of this node's label, when it has one. */
  labelId?: string;
}
export interface FixtureLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
}
export interface FixtureLink {
  id: string;
  source: string;
  target: string;
  /** Authored orthogonal waypoints; the link is `pinned` so load-time routing skips it. */
  waypoints: Pt[];
  longRange: boolean;
}
export interface FixtureZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface FixtureSpec {
  nodes: FixtureNode[];
  labels: FixtureLabel[];
  links: FixtureLink[];
  zones: FixtureZone[];
  /** Bounding extent of the node grid, in world units. */
  world: { width: number; height: number };
}

export interface FixtureOptions {
  nodes: number;
  links: number;
  /** Fraction of nodes that carry a label. */
  labelRatio: number;
  zones: number;
  /** Fraction of links whose endpoints are ≥ 30% of the world width apart. */
  longRangeRatio: number;
  seed: number;
}

/** ~23k drawn elements: the C10 perf target (design §8). */
export const LARGE: FixtureOptions = {
  nodes: 10_000,
  links: 12_000,
  labelRatio: 0.1,
  zones: 40,
  longRangeRatio: 0.05,
  seed: 1
};

/** ~2.7k drawn elements: the required-lane correctness fixture (≥ 2× CULL_MIN_ELEMENTS). */
export const SMALL: FixtureOptions = {
  nodes: 1_200,
  links: 1_400,
  labelRatio: 0.1,
  zones: 10,
  longRangeRatio: 0.05,
  seed: 1
};

const NODE_SIZE = 50;
const SPACING = 130;
const LONG_RANGE_FRACTION = 0.3;

export function drawnElementCount(spec: FixtureSpec): number {
  return spec.nodes.length + spec.links.length + spec.labels.length + spec.zones.length;
}

export function generateFixtureSpec(opts: FixtureOptions): FixtureSpec {
  const rnd = mulberry32(opts.seed);
  const cols = Math.ceil(Math.sqrt(opts.nodes * 1.6));
  const rows = Math.ceil(opts.nodes / cols);
  const world = { width: cols * SPACING, height: rows * SPACING };

  const nodes: FixtureNode[] = [];
  const labels: FixtureLabel[] = [];
  const labelStride = opts.labelRatio > 0 ? Math.max(1, Math.round(1 / opts.labelRatio)) : 0;
  for (let i = 0; i < opts.nodes; i++) {
    const x = (i % cols) * SPACING;
    const y = Math.floor(i / cols) * SPACING;
    const node: FixtureNode = { id: `node_${i}`, x, y, size: NODE_SIZE };
    if (labelStride && i % labelStride === 0) {
      node.labelId = `label_${i}`;
      labels.push({ id: node.labelId, x, y: y + NODE_SIZE + 6, text: `N${i}`, fontSize: 12 });
    }
    nodes.push(node);
  }

  const center = (n: FixtureNode): Pt => ({ x: n.x + n.size / 2, y: n.y + n.size / 2 });
  const links: FixtureLink[] = [];
  const longTarget = Math.round(opts.links * opts.longRangeRatio);
  for (let i = 0; i < opts.links; i++) {
    const wantLong = i < longTarget;
    const s = Math.floor(rnd() * nodes.length);
    let t = s;
    for (let tries = 0; tries < 64; tries++) {
      const cand = wantLong
        ? Math.floor(rnd() * nodes.length)
        : Math.min(
            nodes.length - 1,
            Math.max(0, s + Math.floor(rnd() * 7) - 3 + cols * (Math.floor(rnd() * 3) - 1))
          );
      const far = Math.abs(nodes[cand].x - nodes[s].x) >= world.width * LONG_RANGE_FRACTION;
      if (cand !== s && far === wantLong) {
        t = cand;
        break;
      }
    }
    if (t === s) t = (s + 1) % nodes.length; // degenerate fallback; keeps ids unique
    const a = center(nodes[s]);
    const b = center(nodes[t]);
    links.push({
      id: `link_${i}`,
      source: nodes[s].id,
      target: nodes[t].id,
      waypoints: [a, { x: b.x, y: a.y }, b],
      longRange: Math.abs(nodes[t].x - nodes[s].x) >= world.width * LONG_RANGE_FRACTION
    });
  }

  const zones: FixtureZone[] = [];
  for (let i = 0; i < opts.zones; i++) {
    const width = 300 + Math.floor(rnd() * 500);
    const height = 200 + Math.floor(rnd() * 300);
    zones.push({
      id: `zone_${i}`,
      x: Math.floor(rnd() * Math.max(1, world.width - width)),
      y: Math.floor(rnd() * Math.max(1, world.height - height)),
      width,
      height
    });
  }

  return { nodes, labels, links, zones, world };
}
