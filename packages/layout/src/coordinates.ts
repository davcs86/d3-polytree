import type { IGraph, INode } from './internal';
import type { ResolvedLayoutOptions } from './types';

/**
 * Isotonic regression (pool-adjacent-violators) with weights: the closest
 * non-decreasing sequence to `values` in weighted least squares. Used per layer
 * to snap barycenter targets back to a non-overlapping order — optimal, not a
 * greedy left-push, so alignment is not biased to one side.
 */
function isotonic(values: number[], weights: number[]): number[] {
  const blocks: { sum: number; weight: number; mean: number; count: number }[] = [];
  for (let i = 0; i < values.length; i += 1) {
    let sum = values[i] * weights[i];
    let weight = weights[i];
    let count = 1;
    let mean = sum / weight;
    while (blocks.length > 0 && blocks[blocks.length - 1].mean > mean) {
      const prev = blocks.pop()!;
      sum += prev.sum;
      weight += prev.weight;
      count += prev.count;
      mean = sum / weight;
    }
    blocks.push({ sum, weight, mean, count });
  }
  const out: number[] = [];
  for (const b of blocks) {
    for (let i = 0; i < b.count; i += 1) {
      out.push(b.mean);
    }
  }
  return out;
}

/** Minimum centre-to-centre gap between two order-adjacent nodes. */
function separation(a: INode, b: INode, spacing: number): number {
  return a.sizeOrder / 2 + spacing + b.sizeOrder / 2;
}

/** Place one layer: pull each node to its neighbour barycenter, then resolve
 *  overlaps optimally with {@link isotonic}. Dummies are weighted heavily so
 *  long edges run straight through them. */
function placeLayer(graph: IGraph, layer: string[], useIncoming: boolean, spacing: number): void {
  if (layer.length === 0) {
    return;
  }
  const nodes = layer.map((id) => graph.nodes.get(id)!);
  const adj = useIncoming ? graph.inAdj : graph.outAdj;

  // Cumulative separation offsets: subtracting them turns the "min gap" ordering
  // constraint into a plain "non-decreasing" one for the isotonic solver.
  const offset: number[] = [0];
  for (let i = 1; i < nodes.length; i += 1) {
    offset.push(offset[i - 1] + separation(nodes[i - 1], nodes[i], spacing));
  }

  const desired: number[] = [];
  const weights: number[] = [];
  nodes.forEach((n, i) => {
    const neighbors = (adj.get(n.id) ?? []).map((id) => graph.nodes.get(id)!.coordOrder);
    if (neighbors.length === 0) {
      desired.push(n.coordOrder - offset[i]); // keep put
      weights.push(1);
    } else {
      const bary = neighbors.reduce((s, v) => s + v, 0) / neighbors.length;
      desired.push(bary - offset[i]);
      // Straighten long edges: dummies dominate; real nodes scale with degree.
      weights.push(n.dummy ? 128 : Math.max(1, neighbors.length));
    }
  });

  const z = isotonic(desired, weights);
  nodes.forEach((n, i) => {
    n.coordOrder = z[i] + offset[i];
  });
}

/** Initial left-to-right packing per layer (respecting widths + spacing). */
function initialPacking(graph: IGraph, spacing: number): void {
  for (const layer of graph.layers) {
    let cursor = 0;
    for (let i = 0; i < layer.length; i += 1) {
      const n = graph.nodes.get(layer[i])!;
      if (i === 0) {
        n.coordOrder = n.sizeOrder / 2;
      } else {
        const prev = graph.nodes.get(layer[i - 1])!;
        cursor += separation(prev, n, spacing);
        n.coordOrder = cursor;
      }
      cursor = n.coordOrder;
    }
  }
}

/**
 * Assign every node an abstract (rank, order) centre coordinate. Rank positions
 * stack layer thicknesses + `layerSpacing`; order positions come from the
 * barycenter/isotonic alignment above. Projection to x/y happens in `layout`.
 */
export function assignCoordinates(graph: IGraph, opts: ResolvedLayoutOptions): void {
  // Rank axis: cumulative layer thickness.
  const thickness = graph.layers.map((layer) =>
    layer.reduce((m, id) => Math.max(m, graph.nodes.get(id)!.sizeRank), 0)
  );
  let rankCenter = 0;
  for (let r = 0; r < graph.layers.length; r += 1) {
    rankCenter += thickness[r] / 2;
    for (const id of graph.layers[r]) {
      graph.nodes.get(id)!.coordRank = rankCenter;
    }
    rankCenter += thickness[r] / 2 + opts.layerSpacing;
  }

  // Order axis: pack, then alternate up/down barycenter alignment passes.
  initialPacking(graph, opts.nodeSpacing);
  for (let iter = 0; iter < opts.coordIterations; iter += 1) {
    if (iter % 2 === 0) {
      for (let r = 1; r < graph.layers.length; r += 1) {
        placeLayer(graph, graph.layers[r], true, opts.nodeSpacing);
      }
    } else {
      for (let r = graph.layers.length - 2; r >= 0; r -= 1) {
        placeLayer(graph, graph.layers[r], false, opts.nodeSpacing);
      }
    }
  }
}
