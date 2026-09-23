/** Public types for the layered auto-layout solver. */

/** Flow direction of the layered layout. */
export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

/** A node to place. `width`/`height` are its bounding box; ids must be unique. */
export interface LayoutNode {
  id: string;
  width: number;
  height: number;
}

/** A directed edge between two node ids (source → target). */
export interface LayoutEdge {
  source: string;
  target: string;
}

/** The graph handed to {@link layout}. */
export interface LayoutGraph {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

/** Tuning knobs; every field has a sensible default. */
export interface LayoutOptions {
  /** Flow direction. Default `'TB'` (top-to-bottom). */
  direction?: LayoutDirection;
  /** Minimum gap between two nodes in the same layer. Default `40`. */
  nodeSpacing?: number;
  /** Gap between adjacent layers. Default `80`. */
  layerSpacing?: number;
  /** Padding added around the whole result. Default `20`. */
  margin?: number;
  /** Crossing-reduction sweeps. Default `24`. Higher = better, slower. */
  orderIterations?: number;
  /** Coordinate-alignment sweeps. Default `12`. */
  coordIterations?: number;
}

/** The centre position assigned to a node. */
export interface Point {
  x: number;
  y: number;
}

/** The solver's output: a centre position per input node id, plus the extent. */
export interface LayoutResult {
  positions: Record<string, Point>;
  width: number;
  height: number;
}

/** Fully-resolved options (defaults applied). */
export interface ResolvedLayoutOptions {
  direction: LayoutDirection;
  nodeSpacing: number;
  layerSpacing: number;
  margin: number;
  orderIterations: number;
  coordIterations: number;
}

export const DEFAULT_OPTIONS: ResolvedLayoutOptions = {
  direction: 'TB',
  nodeSpacing: 40,
  layerSpacing: 80,
  margin: 20,
  orderIterations: 24,
  coordIterations: 12
};

export function resolveOptions(options: LayoutOptions = {}): ResolvedLayoutOptions {
  // Clamp to sane minimums so a stray negative/NaN spacing or a negative
  // iteration count can never flow into the solver.
  const nonNeg = (value: number | undefined, fallback: number): number => {
    const v = value ?? fallback;
    return Number.isFinite(v) && v >= 0 ? v : fallback;
  };
  const iters = (value: number | undefined, fallback: number): number => {
    const v = value ?? fallback;
    return Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
  };
  return {
    direction: options.direction ?? DEFAULT_OPTIONS.direction,
    nodeSpacing: nonNeg(options.nodeSpacing, DEFAULT_OPTIONS.nodeSpacing),
    layerSpacing: nonNeg(options.layerSpacing, DEFAULT_OPTIONS.layerSpacing),
    margin: nonNeg(options.margin, DEFAULT_OPTIONS.margin),
    orderIterations: iters(options.orderIterations, DEFAULT_OPTIONS.orderIterations),
    coordIterations: iters(options.coordIterations, DEFAULT_OPTIONS.coordIterations)
  };
}
