import type { LayoutGraph, ResolvedLayoutOptions } from './types';

/** Prefix for synthetic (dummy) nodes on long edges. Chosen not to collide with
 *  real model ids (`node_1`, author-set names, …). */
const DUMMY_PREFIX = '__pt_dummy_';

/**
 * The solver's internal node. Coordinates are kept in an abstract *rank* /
 * *order* space (rank = which layer; order = position within a layer) so the
 * whole pipeline is direction-agnostic — `layout` projects it to x/y at the end.
 * `sizeRank`/`sizeOrder` are the node's extent along each axis.
 */
export interface INode {
  id: string;
  dummy: boolean;
  sizeRank: number;
  sizeOrder: number;
  rank: number;
  order: number;
  coordOrder: number;
  coordRank: number;
}

/** The internal, ranked, acyclic multigraph the ordering/coordinate steps read. */
export interface IGraph {
  nodes: Map<string, INode>;
  outAdj: Map<string, string[]>;
  inAdj: Map<string, string[]>;
  /** layers[rank] = node ids in current left-to-right (order-axis) order. */
  layers: string[][];
}

interface Edge {
  source: string;
  target: string;
}

const edgeKey = (source: string, target: string): string => JSON.stringify([source, target]);

/** Remove cycles by reversing back-edges found in a DFS (greedy, deterministic).
 *  Polytrees are already acyclic, so this is usually a no-op — but it keeps the
 *  solver total on arbitrary input. Returns an acyclic edge set (back-edges
 *  flipped); edge *direction* only affects ranking, never the emitted geometry. */
export function removeCycles(nodeIds: string[], edges: Edge[]): Edge[] {
  const out = new Map<string, string[]>();
  for (const id of nodeIds) {
    out.set(id, []);
  }
  for (const e of edges) {
    out.get(e.source)?.push(e.target);
  }
  const state = new Map<string, 0 | 1 | 2>(); // 0=unseen 1=on-stack 2=done
  const reversedKeys = new Set<string>();

  // Iterative DFS to avoid stack overflow on deep graphs.
  for (const root of nodeIds) {
    if (state.get(root)) {
      continue;
    }
    const stack: { id: string; i: number }[] = [{ id: root, i: 0 }];
    state.set(root, 1);
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const neighbors = out.get(frame.id) ?? [];
      if (frame.i < neighbors.length) {
        const v = neighbors[frame.i];
        frame.i += 1;
        const s = state.get(v) ?? 0;
        if (s === 1) {
          // back-edge → this edge closes a cycle; reverse it
          reversedKeys.add(edgeKey(frame.id, v));
        } else if (s === 0) {
          state.set(v, 1);
          stack.push({ id: v, i: 0 });
        }
      } else {
        state.set(frame.id, 2);
        stack.pop();
      }
    }
  }

  // Rebuild the edge list, flipping the ones marked as back-edges.
  const consumed = new Set<string>();
  const acyclic: Edge[] = [];
  for (const e of edges) {
    const key = edgeKey(e.source, e.target);
    if (reversedKeys.has(key) && !consumed.has(key)) {
      consumed.add(key);
      acyclic.push({ source: e.target, target: e.source });
    } else {
      acyclic.push(e);
    }
  }
  return acyclic;
}

/** Longest-path layer assignment: rank(v) = max over in-edges of rank(u)+1. */
export function assignRanks(nodeIds: string[], edges: Edge[]): Map<string, number> {
  const outAdj = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const id of nodeIds) {
    outAdj.set(id, []);
    indeg.set(id, 0);
  }
  for (const e of edges) {
    outAdj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }
  // Kahn topological order (deterministic: sorted seed + stable pushes).
  const queue = nodeIds.filter((id) => (indeg.get(id) ?? 0) === 0).sort();
  const rank = new Map<string, number>();
  for (const id of nodeIds) {
    rank.set(id, 0);
  }
  const deg = new Map(indeg);
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const v of outAdj.get(u)!) {
      rank.set(v, Math.max(rank.get(v)!, rank.get(u)! + 1));
      deg.set(v, deg.get(v)! - 1);
      if (deg.get(v) === 0) {
        queue.push(v);
      }
    }
  }
  return rank;
}

/**
 * Build the ranked, acyclic, dummy-augmented internal graph with an initial
 * left-to-right order per layer (BFS discovery order from sorted roots).
 */
export function buildInternal(graph: LayoutGraph, opts: ResolvedLayoutOptions): IGraph {
  const horizontalRank = opts.direction === 'LR' || opts.direction === 'RL';
  const nodes = new Map<string, INode>();
  for (const n of graph.nodes) {
    nodes.set(n.id, {
      id: n.id,
      dummy: false,
      sizeRank: horizontalRank ? n.width : n.height,
      sizeOrder: horizontalRank ? n.height : n.width,
      rank: 0,
      order: 0,
      coordOrder: 0,
      coordRank: 0
    });
  }

  // Keep only edges between known, distinct nodes (drop self-loops/dangling).
  const valid = graph.edges.filter(
    (e) => e.source !== e.target && nodes.has(e.source) && nodes.has(e.target)
  );
  const ids = [...nodes.keys()];
  const acyclic = removeCycles(ids, valid);
  const rank = assignRanks(ids, acyclic);
  for (const id of ids) {
    nodes.get(id)!.rank = rank.get(id)!;
  }

  // Insert dummy chains for edges spanning more than one rank.
  const outAdj = new Map<string, string[]>();
  const inAdj = new Map<string, string[]>();
  for (const id of nodes.keys()) {
    outAdj.set(id, []);
    inAdj.set(id, []);
  }
  let dummyCount = 0;
  const link = (a: string, b: string): void => {
    outAdj.get(a)!.push(b);
    inAdj.get(b)!.push(a);
  };
  for (const e of acyclic) {
    const r0 = nodes.get(e.source)!.rank;
    const r1 = nodes.get(e.target)!.rank;
    if (r1 - r0 <= 1) {
      link(e.source, e.target);
      continue;
    }
    let prev = e.source;
    for (let r = r0 + 1; r < r1; r += 1) {
      const id = `${DUMMY_PREFIX}${dummyCount++}`;
      nodes.set(id, {
        id,
        dummy: true,
        sizeRank: 0,
        sizeOrder: 0,
        rank: r,
        order: 0,
        coordOrder: 0,
        coordRank: 0
      });
      outAdj.set(id, []);
      inAdj.set(id, []);
      link(prev, id);
      prev = id;
    }
    link(prev, e.target);
  }

  // Initial per-layer order via BFS from sorted roots (indeg 0), then any
  // leftovers by id — deterministic and low-crossing to start from.
  const maxRank = Math.max(0, ...[...nodes.values()].map((n) => n.rank));
  const layers: string[][] = Array.from({ length: maxRank + 1 }, () => []);
  const placed = new Set<string>();
  const roots = [...nodes.values()]
    .filter((n) => (inAdj.get(n.id)!.length ?? 0) === 0)
    .map((n) => n.id)
    .sort();
  const queue = [...roots];
  for (const id of queue) {
    placed.add(id);
  }
  while (queue.length > 0) {
    const u = queue.shift()!;
    layers[nodes.get(u)!.rank].push(u);
    for (const v of outAdj.get(u)!) {
      if (!placed.has(v)) {
        placed.add(v);
        queue.push(v);
      }
    }
  }
  // Any node not reached (e.g. isolated with in-edges only from cycles) — append.
  for (const n of nodes.values()) {
    if (!placed.has(n.id)) {
      layers[n.rank].push(n.id);
    }
  }
  for (const layer of layers) {
    layer.forEach((id, i) => {
      nodes.get(id)!.order = i;
    });
  }

  return { nodes, outAdj, inAdj, layers };
}
