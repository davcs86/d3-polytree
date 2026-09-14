import { describe, it, expect, beforeEach } from 'vitest';
import { emptyModel } from '@d3-polytree/core';
import { Viewer } from '@d3-polytree/viewer';
import { InteractiveViewer } from './index';

/** Build a `.pfdn` document with a single node via the core moddle. */
function oneNodeDiagram(): string {
  const seed = emptyModel();
  const node = seed.moddle.create('pfdn:Node', {
    id: 'N1',
    position: seed.moddle.create('pfdn:Coordinates', { x: 20, y: 30 })
  });
  (seed.definitions as { node?: unknown[] }).node = [node];
  return seed.moddle.toXML(seed.definitions);
}

describe('@d3-polytree/interactive-viewer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('extends the base Viewer and adds interaction modules', () => {
    const viewer = new InteractiveViewer();
    expect(viewer).toBeInstanceOf(Viewer);
    expect(viewer.getModules().length).toBeGreaterThan(Viewer.modules.length);
  });

  it('renders an imported node with its selection outline attached', async () => {
    const viewer = new InteractiveViewer({ container: document.body });
    await viewer.importDiagram(oneNodeDiagram());

    const nodeEl = document.body.querySelector('[element-id="N1"]');
    expect(nodeEl).not.toBeNull();
    // Outline subscribed before the drawer emitted node.created (boot order),
    // so the node carries an .element-outline rect.
    expect(nodeEl?.querySelector('.element-outline')).not.toBeNull();
  });

  it('paints the background and grid, and boots pan/zoom', async () => {
    const viewer = new InteractiveViewer({ container: document.body });
    await viewer.importDiagram(oneNodeDiagram());

    // background rect + axis grid are inserted on the root layer
    expect(document.body.querySelector('rect')).not.toBeNull();
    expect(document.body.querySelector('g.axis')).not.toBeNull();
    // zoom is a resolvable service on the running engine
    expect(viewer.get('zoom')).toBeTruthy();
  });
});
