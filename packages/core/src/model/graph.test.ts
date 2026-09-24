import { describe, it, expect } from 'vitest';
import { buildModelGraph } from './graph';
import type { ModellingModelElement } from '../modelling/types';

const node = (id: string) => ({ id }) as unknown as ModellingModelElement;
const link = (id: string, source?: { id: string }, target?: { id: string }) =>
  ({ id, source, target }) as unknown as ModellingModelElement;

describe('buildModelGraph', () => {
  it('maps nodes in input order, sizing via sizeOf (default 1)', () => {
    const nodes = [node('a'), node('b')];
    const g = buildModelGraph({ nodes, links: [], isLive: () => true });
    expect(g.nodes).toEqual([
      { id: 'a', width: 1, height: 1 },
      { id: 'b', width: 1, height: 1 }
    ]);
    const sized = buildModelGraph({ nodes, links: [], isLive: () => true, sizeOf: () => 40 });
    expect(sized.nodes.map((n) => n.width)).toEqual([40, 40]);
    expect(sized.nodes.map((n) => n.id)).toEqual(['a', 'b']); // order preserved
  });

  it('keeps only edges whose endpoints are both in the node set and live', () => {
    const nodes = [node('a'), node('b')];
    const links = [
      link('e1', { id: 'a' }, { id: 'b' }), // ok
      link('e2', { id: 'a' }, { id: 'ghost' }), // endpoint absent from the node set → dropped
      link('e3', undefined, { id: 'b' }), // missing source → dropped
      link('e4', { id: 'a' }, { id: 'b' }) // not live → dropped
    ];
    const g = buildModelGraph({ nodes, links, isLive: (id) => id !== 'e4' });
    expect(g.edges).toEqual([{ source: 'a', target: 'b' }]); // only e1 survives
  });

  it('empty input yields an empty graph', () => {
    expect(buildModelGraph({ nodes: [], links: [], isLive: () => true })).toEqual({
      nodes: [],
      edges: []
    });
  });
});
