import { describe, it, expect, beforeEach } from 'vitest';
import type { ModelElement } from '@d3-polytree/pfdn-moddle';
import { Diagram } from '../Diagram';
import { createModelModule, emptyModel, ensureSettings, loadModel } from './model';

describe('model provider', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('emptyModel builds a pfdn:Diagram host', () => {
    const host = emptyModel();
    expect(host.definitions.$type).toBe('pfdn:Diagram');
  });

  it('emptyModel normalises a complete settings sub-tree', () => {
    const { definitions } = emptyModel();
    const settings = definitions.settings as Record<string, ModelElement>;
    expect(settings.$type).toBe('pfdn:Settings');
    expect(settings.zoom.$type).toBe('pfdn:Zoom');
    expect((settings.zoom as Record<string, ModelElement>).offset.$type).toBe('pfdn:Coordinates');
    expect(settings.zoom.scale).toBe(1);
    expect(settings.grid.$type).toBe('pfdn:Grid');
  });

  it('ensureSettings backfills only the missing pieces and is idempotent', () => {
    const host = emptyModel();
    const existingSettings = host.definitions.settings;
    const existingZoom = (existingSettings as Record<string, unknown>).zoom;
    // a second pass keeps the existing instances (no clobbering)
    ensureSettings(host.definitions, host.moddle);
    expect(host.definitions.settings).toBe(existingSettings);
    expect((host.definitions.settings as Record<string, unknown>).zoom).toBe(existingZoom);
  });

  it('exposes settings.zoom.offset via a deep dotted token', () => {
    const host = emptyModel();
    const diagram = new Diagram({ container: document.body, modules: [createModelModule(host)] });
    const offset = diagram.get<ModelElement>('d3polytree.definitions.settings.zoom.offset');
    expect(offset.$type).toBe('pfdn:Coordinates');
  });

  it('registers d3polytree.moddle and d3polytree.definitions for injection', () => {
    const host = emptyModel();
    const diagram = new Diagram({ container: document.body, modules: [createModelModule(host)] });
    expect(diagram.get('d3polytree.moddle')).toBe(host.moddle);
    expect(diagram.get('d3polytree.definitions')).toBe(host.definitions);
  });

  it('routes link waypoints to node borders at load (not centre-to-centre)', async () => {
    // node_a (80,90) size 50 → centre (105,115); node_b (340,230) size 50 →
    // centre (365,255). The document ships the link as a straight centre-to-centre
    // line; loadModel must route it to edge-docked orthogonal waypoints so it
    // renders correctly on first paint — including in the static Viewer, which has
    // no modelling layer to re-route on drag.
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<pfdn:diagram xmlns:pfdn="http://pfdn" xmlns="http://pfdn">
  <settings author="t" name="t" status="1"><zoom><offset x="0" y="0" /><scale>1</scale></zoom><grid /></settings>
  <node id="node_a" type="default" size="50" status="1"><position x="80" y="90" /></node>
  <node id="node_b" type="default" size="50" status="1"><position x="340" y="230" /></node>
  <link id="link_ab" source="node_a" target="node_b" status="1">
    <waypoint x="105" y="115" /><waypoint x="365" y="255" />
  </link>
</pfdn:diagram>`;

    const host = await loadModel(xml);
    const links = host.definitions.link as Array<{ waypoint: Array<{ x: number; y: number }> }>;
    // moddle waypoints carry $type; compare on coordinates only
    const wp = links[0].waypoint.map((p) => ({ x: p.x, y: p.y }));

    // an orthogonal path: source border → elbow → target border
    expect(wp).toEqual([
      { x: 135, y: 115 }, // docked at node_a's right border (80 + 50 + 5), not centre 105
      { x: 365, y: 115 }, // orthogonal elbow
      { x: 365, y: 225 } //  docked at node_b's top border (230 - 5), not centre 255
    ]);
    // guard against the regression explicitly: neither endpoint is a node centre
    expect(wp[0]).not.toEqual({ x: 105, y: 115 });
    expect(wp[wp.length - 1]).not.toEqual({ x: 365, y: 255 });
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
