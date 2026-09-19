import { assignCoordinates } from './coordinates';
import { buildInternal } from './internal';
import { reduceCrossings } from './order';
import {
  type LayoutGraph,
  type LayoutOptions,
  type LayoutResult,
  type Point,
  resolveOptions
} from './types';

/**
 * Compute a layered (Sugiyama) layout for `graph`.
 *
 * Pure and deterministic: no DOM, no D3, no randomness — the same graph and
 * options always produce the same coordinates, which is what makes it unit-
 * testable on numeric fixtures and safe under the C8 visual-regression net.
 *
 * Pipeline: cycle-break → longest-path layering → dummy chains for long edges →
 * median + transpose crossing reduction → barycenter/isotonic coordinate
 * assignment. Returns each *real* node's centre position plus the overall
 * extent; dummy nodes are internal and never surface.
 */
export function layout(graph: LayoutGraph, options: LayoutOptions = {}): LayoutResult {
  const opts = resolveOptions(options);
  if (graph.nodes.length === 0) {
    return { positions: {}, width: 0, height: 0 };
  }

  const internal = buildInternal(graph, opts);
  reduceCrossings(internal, opts.orderIterations);
  assignCoordinates(internal, opts);

  // Flip bounds for the reversed directions.
  let rankMin = Infinity;
  let rankMax = -Infinity;
  for (const n of internal.nodes.values()) {
    rankMin = Math.min(rankMin, n.coordRank);
    rankMax = Math.max(rankMax, n.coordRank);
  }
  const flipRank = (r: number): number => rankMin + rankMax - r;

  const sizeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const raw: Record<string, Point> = {};
  for (const node of graph.nodes) {
    const n = internal.nodes.get(node.id)!;
    let x: number;
    let y: number;
    switch (opts.direction) {
      case 'BT':
        x = n.coordOrder;
        y = flipRank(n.coordRank);
        break;
      case 'LR':
        x = n.coordRank;
        y = n.coordOrder;
        break;
      case 'RL':
        x = flipRank(n.coordRank);
        y = n.coordOrder;
        break;
      case 'TB':
      default:
        x = n.coordOrder;
        y = n.coordRank;
        break;
    }
    raw[node.id] = { x, y };
  }

  // Normalise so the top-left of the content sits at (margin, margin).
  let minLeft = Infinity;
  let minTop = Infinity;
  let maxRight = -Infinity;
  let maxBottom = -Infinity;
  for (const node of graph.nodes) {
    const p = raw[node.id];
    const s = sizeById.get(node.id)!;
    minLeft = Math.min(minLeft, p.x - s.width / 2);
    minTop = Math.min(minTop, p.y - s.height / 2);
    maxRight = Math.max(maxRight, p.x + s.width / 2);
    maxBottom = Math.max(maxBottom, p.y + s.height / 2);
  }
  const dx = opts.margin - minLeft;
  const dy = opts.margin - minTop;

  const positions: Record<string, Point> = {};
  for (const node of graph.nodes) {
    positions[node.id] = { x: raw[node.id].x + dx, y: raw[node.id].y + dy };
  }

  return {
    positions,
    width: maxRight - minLeft + opts.margin * 2,
    height: maxBottom - minTop + opts.margin * 2
  };
}
