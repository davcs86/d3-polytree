import { describe, it, expect } from 'vitest';
import {
  PfdnValidationError,
  type PfdnDocument,
  type ModelElement
} from '@d3-polytree/pfdn-moddle';
import { loadModelFromJson } from './model';

describe('loadModelFromJson', () => {
  it('boots a settings-less document (ensureSettings fills the gaps)', async () => {
    const { definitions } = await loadModelFromJson({ $type: 'pfdn:Diagram', id: 'D1' });
    const settings = definitions.settings as ModelElement;
    expect(settings).toBeDefined();
    const zoom = settings.zoom as ModelElement;
    expect(zoom.offset).toBeDefined();
    expect(settings.grid).toBeDefined();
  });

  it('accepts a JSON string and routes links up front', async () => {
    const doc: PfdnDocument = {
      $type: 'pfdn:Diagram',
      id: 'D1',
      node: [
        { $type: 'pfdn:Node', id: 'n1', position: { $type: 'pfdn:Coordinates', x: 0, y: 0 } },
        { $type: 'pfdn:Node', id: 'n2', position: { $type: 'pfdn:Coordinates', x: 200, y: 0 } }
      ],
      link: [{ $type: 'pfdn:Link', id: 'e1', source: 'n1', target: 'n2' }]
    };
    const { definitions } = await loadModelFromJson(JSON.stringify(doc));
    const link = (definitions.link as ModelElement[])[0];
    expect(Array.isArray(link.waypoint)).toBe(true);
    expect((link.waypoint as unknown[]).length).toBeGreaterThan(0);
  });

  it('throws PfdnValidationError on a malformed JSON string', async () => {
    await expect(loadModelFromJson('{ not json')).rejects.toBeInstanceOf(PfdnValidationError);
  });

  it('throws PfdnValidationError on a schema violation (dangling reference)', async () => {
    const doc = {
      $type: 'pfdn:Diagram',
      id: 'D1',
      node: [{ $type: 'pfdn:Node', id: 'n1', label: 'ghost' }]
    };
    await expect(loadModelFromJson(doc as PfdnDocument)).rejects.toBeInstanceOf(
      PfdnValidationError
    );
  });

  it('lax mode tolerates a dangling reference', async () => {
    const doc = {
      $type: 'pfdn:Diagram',
      id: 'D1',
      node: [{ $type: 'pfdn:Node', id: 'n1', label: 'ghost' }]
    };
    const { definitions } = await loadModelFromJson(doc as PfdnDocument, { lax: true });
    expect((definitions.node as ModelElement[])[0].label).toBeUndefined();
  });

  it('loads a caller-extended model when packages are supplied, and rejects it without (C14)', async () => {
    const packages = {
      ext: {
        name: 'Ext',
        uri: 'http://example.com/ext',
        prefix: 'ext',
        types: [
          {
            name: 'Custom',
            superClass: ['pfdn:Node'],
            properties: [{ name: 'flavor', type: 'String', isAttr: true }]
          }
        ]
      }
    };
    const doc = {
      $type: 'pfdn:Diagram',
      id: 'D1',
      node: [{ $type: 'ext:Custom', id: 'c1', flavor: 'spicy' }]
    } as unknown as PfdnDocument;

    const { definitions } = await loadModelFromJson(doc, { packages });
    const custom = (definitions.node as ModelElement[])[0];
    expect(custom.$type).toBe('ext:Custom');
    expect(custom.flavor).toBe('spicy');

    await expect(loadModelFromJson(doc)).rejects.toBeInstanceOf(PfdnValidationError);
  });
});
