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
