import { describe, expect, it } from 'vitest';
import { layout } from './layout';
import type { LayoutGraph, LayoutNode, LayoutResult } from './types';

const N = (id: string, width = 40, height = 40): LayoutNode => ({ id, width, height });

/** True if two node boxes (centre positions + sizes) overlap beyond epsilon. */
function overlaps(result: LayoutResult, a: LayoutNode, b: LayoutNode, eps = 1e-6): boolean {
  const pa = result.positions[a.id];
  const pb = result.positions[b.id];
  const dx = Math.abs(pa.x - pb.x);
  const dy = Math.abs(pa.y - pb.y);
  return dx < (a.width + b.width) / 2 - eps && dy < (a.height + b.height) / 2 - eps;
}

function assertNoOverlaps(result: LayoutResult, nodes: LayoutNode[]): void {
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      expect(overlaps(result, nodes[i], nodes[j]), `${nodes[i].id} vs ${nodes[j].id}`).toBe(false);
    }
  }
}

describe('layout', () => {
  it('returns an empty result for an empty graph', () => {
    expect(layout({ nodes: [], edges: [] })).toEqual({ positions: {}, width: 0, height: 0 });
  });

  it('centres a single node at the margin', () => {
    const r = layout({ nodes: [N('a', 30, 20)], edges: [] });
    expect(r.positions.a).toEqual({ x: 35, y: 30 }); // margin 20 + half size
  });

  it('stacks a chain into increasing ranks (TB) and keeps it straight', () => {
    const nodes = [N('a'), N('b'), N('c')];
    const graph: LayoutGraph = {
      nodes,
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' }
      ]
    };
    const r = layout(graph);
    expect(r.positions.a.y).toBeLessThan(r.positions.b.y);
    expect(r.positions.b.y).toBeLessThan(r.positions.c.y);
    // A straight chain: all three share an x.
    expect(r.positions.a.x).toBeCloseTo(r.positions.b.x, 5);
    expect(r.positions.b.x).toBeCloseTo(r.positions.c.x, 5);
  });

  it('places a parent above two separated children with no overlap', () => {
    const nodes = [N('root'), N('l'), N('r')];
    const r = layout({
      nodes,
      edges: [
        { source: 'root', target: 'l' },
        { source: 'root', target: 'r' }
      ]
    });
    expect(r.positions.root.y).toBeLessThan(r.positions.l.y);
    expect(r.positions.l.y).toBeCloseTo(r.positions.r.y, 5); // same rank
    assertNoOverlaps(r, nodes);
    // Parent roughly centred over its children.
    const mid = (r.positions.l.x + r.positions.r.x) / 2;
    expect(r.positions.root.x).toBeCloseTo(mid, 5);
  });

  it('never overlaps nodes on a wider tree', () => {
    const nodes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => N(id, 50, 30));
    const r = layout({
      nodes,
      edges: [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' },
        { source: 'b', target: 'd' },
        { source: 'b', target: 'e' },
        { source: 'c', target: 'f' },
        { source: 'c', target: 'g' }
      ]
    });
    assertNoOverlaps(r, nodes);
  });

  it('handles a long edge (dummy chain) without overlap or hanging', () => {
    const nodes = [N('a'), N('b'), N('c')];
    const r = layout({
      nodes,
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'a', target: 'c' } // spans two ranks → dummy node
      ]
    });
    expect(r.positions.a.y).toBeLessThan(r.positions.c.y);
    assertNoOverlaps(r, nodes);
  });

  it('is total on cyclic input (does not hang)', () => {
    const nodes = [N('a'), N('b'), N('c')];
    const r = layout({
      nodes,
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'c', target: 'a' } // cycle
      ]
    });
    expect(Object.keys(r.positions)).toHaveLength(3);
    assertNoOverlaps(r, nodes);
  });

  it('is deterministic', () => {
    const graph: LayoutGraph = {
      nodes: ['a', 'b', 'c', 'd', 'e'].map((id) => N(id)),
      edges: [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' },
        { source: 'b', target: 'd' },
        { source: 'c', target: 'd' },
        { source: 'd', target: 'e' }
      ]
    };
    expect(layout(graph)).toEqual(layout(graph));
  });

  it('lays out left-to-right when direction is LR', () => {
    const nodes = [N('a'), N('b'), N('c')];
    const r = layout(
      {
        nodes,
        edges: [
          { source: 'a', target: 'b' },
          { source: 'b', target: 'c' }
        ]
      },
      { direction: 'LR' }
    );
    expect(r.positions.a.x).toBeLessThan(r.positions.b.x);
    expect(r.positions.b.x).toBeLessThan(r.positions.c.x);
    expect(r.positions.a.y).toBeCloseTo(r.positions.c.y, 5);
  });

  it('flips the flow for BT', () => {
    const r = layout(
      { nodes: [N('a'), N('b')], edges: [{ source: 'a', target: 'b' }] },
      { direction: 'BT' }
    );
    // source below target when bottom-to-top
    expect(r.positions.a.y).toBeGreaterThan(r.positions.b.y);
  });

  it('keeps all nodes within the reported extent', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((id) => N(id, 60, 40));
    const r = layout({
      nodes,
      edges: [
        { source: 'a', target: 'b' },
        { source: 'a', target: 'c' },
        { source: 'a', target: 'd' }
      ]
    });
    for (const n of nodes) {
      const p = r.positions[n.id];
      expect(p.x - n.width / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(p.y - n.height / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(p.x + n.width / 2).toBeLessThanOrEqual(r.width + 1e-6);
      expect(p.y + n.height / 2).toBeLessThanOrEqual(r.height + 1e-6);
    }
  });
});
