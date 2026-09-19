import type { IGraph } from './internal';

/** Crossings between layer `r` (upper) and `r+1` (lower) at current order. */
function crossingsBetween(graph: IGraph, r: number): number {
  const upper = graph.layers[r];
  const lower = graph.layers[r + 1];
  if (!upper || !lower) {
    return 0;
  }
  const orderLower = new Map<string, number>();
  lower.forEach((id, i) => orderLower.set(id, i));

  // Edge endpoints as (upperPos, lowerPos), swept left→right along the upper
  // layer; count inversions in the lower positions (each inversion = a crossing).
  const south: number[] = [];
  for (let i = 0; i < upper.length; i += 1) {
    const targets = graph.outAdj.get(upper[i]) ?? [];
    const lowers = targets
      .map((t) => orderLower.get(t))
      .filter((v): v is number => v !== undefined)
      .sort((a, b) => a - b);
    south.push(...lowers);
  }
  let crossings = 0;
  for (let i = 0; i < south.length; i += 1) {
    for (let j = i + 1; j < south.length; j += 1) {
      if (south[i] > south[j]) {
        crossings += 1;
      }
    }
  }
  return crossings;
}

/** Total crossings across the whole layering. */
export function countCrossings(graph: IGraph): number {
  let total = 0;
  for (let r = 0; r < graph.layers.length - 1; r += 1) {
    total += crossingsBetween(graph, r);
  }
  return total;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return -1;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[m];
  }
  return (sorted[m - 1] + sorted[m]) / 2;
}

function reorderByMedian(graph: IGraph, r: number, fromRank: number): void {
  const adj = fromRank < r ? graph.inAdj : graph.outAdj;
  const neighborOrder = new Map<string, number>();
  (graph.layers[fromRank] ?? []).forEach((id, i) => neighborOrder.set(id, i));

  const layer = graph.layers[r];
  const keyed = layer.map((id, i) => {
    const neighbors = (adj.get(id) ?? [])
      .map((n) => neighborOrder.get(n))
      .filter((v): v is number => v !== undefined);
    const med = median(neighbors);
    // Nodes with no neighbors on that side keep their current slot.
    return { id, key: med < 0 ? i : med, tie: i };
  });
  keyed.sort((a, b) => a.key - b.key || a.tie - b.tie);
  graph.layers[r] = keyed.map((k) => k.id);
  graph.layers[r].forEach((id, i) => {
    graph.nodes.get(id)!.order = i;
  });
}

function syncOrder(graph: IGraph): void {
  for (const layer of graph.layers) {
    layer.forEach((id, i) => {
      graph.nodes.get(id)!.order = i;
    });
  }
}

/** One pass of adjacent-swap transposition; returns true if anything improved. */
function transpose(graph: IGraph): boolean {
  let improved = false;
  for (let r = 0; r < graph.layers.length; r += 1) {
    const layer = graph.layers[r];
    for (let i = 0; i < layer.length - 1; i += 1) {
      const before = crossingsBetween(graph, r - 1) + crossingsBetween(graph, r);
      [layer[i], layer[i + 1]] = [layer[i + 1], layer[i]];
      syncOrder(graph);
      const after = crossingsBetween(graph, r - 1) + crossingsBetween(graph, r);
      if (after < before) {
        improved = true;
      } else {
        // revert
        [layer[i], layer[i + 1]] = [layer[i + 1], layer[i]];
        syncOrder(graph);
      }
    }
  }
  return improved;
}

function snapshot(graph: IGraph): string[][] {
  return graph.layers.map((l) => [...l]);
}

function restore(graph: IGraph, layers: string[][]): void {
  graph.layers = layers.map((l) => [...l]);
  syncOrder(graph);
}

/**
 * Crossing reduction: alternating median sweeps + transposition, keeping the
 * best ordering seen. Deterministic (stable ties), so the same graph always
 * yields the same layout — the precondition for the C8 visual-regression net.
 */
export function reduceCrossings(graph: IGraph, iterations: number): void {
  let best = snapshot(graph);
  let bestCrossings = countCrossings(graph);

  for (let iter = 0; iter < iterations; iter += 1) {
    // Alternate sweep direction each iteration.
    if (iter % 2 === 0) {
      for (let r = 1; r < graph.layers.length; r += 1) {
        reorderByMedian(graph, r, r - 1);
      }
    } else {
      for (let r = graph.layers.length - 2; r >= 0; r -= 1) {
        reorderByMedian(graph, r, r + 1);
      }
    }
    // Local optimisation until it stops helping (bounded).
    let guard = 0;
    while (transpose(graph) && guard < 8) {
      guard += 1;
    }
    const c = countCrossings(graph);
    if (c < bestCrossings) {
      bestCrossings = c;
      best = snapshot(graph);
      if (c === 0) {
        break;
      }
    }
  }
  restore(graph, best);
}
