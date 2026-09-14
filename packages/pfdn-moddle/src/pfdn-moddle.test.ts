import { describe, it, expect } from 'vitest';
import createPfdnModdle, { PfdnModdle, type ModelElement } from './index';

describe('@d3-polytree/pfdn-moddle', () => {
  it('creates a PfdnModdle with the pfdn package registered', () => {
    const moddle = createPfdnModdle();
    expect(moddle).toBeInstanceOf(PfdnModdle);
    const diagram = moddle.create('pfdn:Diagram', { id: 'D1', name: 'demo' });
    expect(diagram.$type).toBe('pfdn:Diagram');
  });

  it('applies the Statusable default (status = 0)', () => {
    const moddle = createPfdnModdle();
    const node = moddle.create('pfdn:Node', { id: 'N1' });
    expect(node.status).toBe(0);
  });

  it('round-trips a diagram through toXML → fromXML', async () => {
    const moddle = createPfdnModdle();
    const node = moddle.create('pfdn:Node', { id: 'N1', name: 'NodeA' });
    const diagram = moddle.create('pfdn:Diagram', { id: 'D1', name: 'demo' });
    diagram.node = [node];

    const xml = moddle.toXML(diagram);
    // moddle-xml serializes element names with a lower-case initial (pfdn:diagram)
    expect(xml.toLowerCase()).toContain('pfdn:diagram');
    expect(xml.toLowerCase()).toContain('pfdn:node');
    expect(xml).toContain('http://pfdn');

    const { rootElement } = await moddle.fromXML(xml, 'pfdn:Diagram');
    expect(rootElement.$type).toBe('pfdn:Diagram');
    expect(rootElement.id).toBe('D1');
    const nodes = rootElement.node as ModelElement[];
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('N1');
    expect(nodes[0].name).toBe('NodeA');
  });
});
