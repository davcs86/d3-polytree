import { describe, it, expect, beforeEach } from 'vitest';
import type { ModelElement } from '@d3-polytree/pfdn-moddle';
import { Diagram } from '../Diagram';
import { createModelModule, emptyModel, loadModel } from './model';

describe('model provider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('emptyModel builds a pfdn:Diagram host', () => {
    const host = emptyModel();
    expect(host.definitions.$type).toBe('pfdn:Diagram');
  });

  it('registers d3polytree.moddle and d3polytree.definitions for injection', () => {
    const host = emptyModel();
    const diagram = new Diagram({ container: document.body, modules: [createModelModule(host)] });
    expect(diagram.get('d3polytree.moddle')).toBe(host.moddle);
    expect(diagram.get('d3polytree.definitions')).toBe(host.definitions);
  });

  it('exposes the definition arrays via dotted tokens after a round-trip load', async () => {
    // build valid .pfdn XML via the model, then load it back
    const seed = emptyModel();
    const node = seed.moddle.create('pfdn:Node', { id: 'N1', name: 'A' });
    seed.definitions.node = [node];
    const xml = seed.moddle.toXML(seed.definitions);

    const host = await loadModel(xml);
    const diagram = new Diagram({ container: document.body, modules: [createModelModule(host)] });
    const nodes = diagram.get<ModelElement[]>('d3polytree.definitions.node');
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes[0].id).toBe('N1');
  });
});
