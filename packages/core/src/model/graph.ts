import type { LayoutGraph } from '@d3-polytree/layout';
import type { ModellingModelElement } from '../modelling/types';

/** Inputs for {@link buildModelGraph}. */
export interface ModelGraphInput {
  /** The node definitions, in the order they should appear in the graph. */
  nodes: ModellingModelElement[];
  /** The link definitions (their `source`/`target` supply the edges). */
  links: ModellingModelElement[];
  /** Whether an element id currently has a live drawing (i.e. is not deleted). */
  isLive: (id: string) => boolean;
  /** Per-node bounding size; defaults to `1` (topology-only callers). */
  sizeOf?: (def: ModellingModelElement) => number;
}

/**
 * Assemble a {@link LayoutGraph} from model node/link definitions — the shared
 * graph builder used by both `autoLayout` (with a real `sizeOf`) and the
 * keyboard-navigation feature (topology only). Edges are kept only when the link
 * is live and BOTH endpoints resolve to a node in the set, matching the layout
 * solver's contract. Node order is preserved.
 */
export function buildModelGraph(input: ModelGraphInput): LayoutGraph {
  const { nodes, links, isLive } = input;
  const sizeOf = input.sizeOf ?? (() => 1);
  const ids = new Set(nodes.map((n) => n.id as string));
  const graphNodes = nodes.map((n) => {
    const size = sizeOf(n);
    return { id: n.id as string, width: size, height: size };
  });
  const edges = links
    .filter((l) => isLive(l.id as string))
    .map((l) => ({
      source: (l.source as ModellingModelElement | undefined)?.id as string | undefined,
      target: (l.target as ModellingModelElement | undefined)?.id as string | undefined
    }))
    .filter(
      (e): e is { source: string; target: string } =>
        !!e.source && !!e.target && ids.has(e.source) && ids.has(e.target)
    );
  return { nodes: graphNodes, edges };
}
