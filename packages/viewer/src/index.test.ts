import { describe, it, expect, beforeEach } from 'vitest';
import { emptyModel } from '@d3-polytree/core';
import { Viewer } from './index';

/** Build a `.pfdn` document with a single node via the core moddle. */
function oneNodeDiagram(): string {
  const seed = emptyModel();
  const node = seed.moddle.create('pfdn:Node', {
    id: 'N1',
    name: 'Alpha',
    position: seed.moddle.create('pfdn:Coordinates', { x: 20, y: 30 })
  });
  (seed.definitions as { node?: unknown[] }).node = [node];
  return seed.moddle.toXML(seed.definitions);
}

describe('@d3-polytree/viewer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('constructs and exposes draw modules', () => {
    const viewer = new Viewer({});
    expect(viewer).toBeInstanceOf(Viewer);
    expect(viewer.getModules().length).toBeGreaterThan(0);
  });

  it('renders an empty diagram into its container', () => {
    const viewer = new Viewer({ container: document.body });
    viewer.createEmpty();
    expect(document.body.querySelector('svg')).not.toBeNull();
    expect(viewer.getHost()?.definitions.$type).toBe('pfdn:Diagram');
  });

  it('imports a .pfdn document and renders its node end-to-end', async () => {
    const viewer = new Viewer({ container: document.body });
    await viewer.importDiagram(oneNodeDiagram());

    // the ported Nodes drawer renders a <g> tagged with the element id
    const nodeEl = document.body.querySelector('[element-id="N1"]');
    expect(nodeEl).not.toBeNull();
    expect(nodeEl?.classList.contains('nodeItem')).toBe(true);
    // the model round-tripped into the running engine
    const nodes = viewer.getHost()?.definitions.node as Array<{ id?: string }>;
    expect(nodes[0].id).toBe('N1');
  });

  it('throws a clear error when resolving services before load', () => {
    const viewer = new Viewer({ container: document.body });
    expect(() => viewer.get('canvas')).toThrow(/no diagram loaded/);
  });

  it('acts as the d3polytree host and round-trips through export', async () => {
    const viewer = new Viewer({ container: document.body });
    await viewer.importDiagram(oneNodeDiagram());

    // the running engine resolves the model tokens off this instance
    expect(viewer.get('d3polytree.moddle')).toBe(viewer.moddle);
    expect(viewer.get('d3polytree.definitions')).toBe(viewer.definitions);

    const xml = viewer.exportDiagram();
    expect(xml.toLowerCase()).toContain('pfdn:node');
    expect(viewer.exportSVG()).toContain('<svg');
  });
});
