import { describe, it, expect } from 'vitest';
import createPfdnModdle, {
  toJson,
  fromJson,
  validate,
  assertValid,
  PfdnValidationError,
  type ModelElement,
  type PfdnDocument
} from './index';

/**
 * Build the "sharp" fixture (design gate 3) directly via moddle — the proven XML
 * path — so it is the ground-truth oracle: a status=0 node with omitted defaults,
 * a referenced label, forward-referencing links, a default and a non-default
 * pinned link, a nested Zoom.offset, a propertiesSet reference, genuinely absent
 * isMany collections, and a present non-default scalar (status=2, size=40).
 */
function buildSharpModel(): { moddle: ReturnType<typeof createPfdnModdle>; diagram: ModelElement } {
  const moddle = createPfdnModdle();
  const label = moddle.create('pfdn:Label', { id: 'l1', text: 'Start' });
  const property = moddle.create('pfdn:Property', { name: 'k', value: 'v' });
  const props = moddle.create('pfdn:PropertiesSet', { id: 'ps1', property: [property] });
  const n1 = moddle.create('pfdn:Node', {
    id: 'n1',
    // status (0), type ("default"), size (25) left at defaults → must be omitted
    position: moddle.create('pfdn:Coordinates', { x: 10, y: 20 }),
    label, // reference → collapses to "l1"
    propertiesSet: props // reference → "ps1"
  });
  const n2 = moddle.create('pfdn:Node', {
    id: 'n2',
    status: 2, // present, non-default scalar → must survive
    size: 40, // present, non-default scalar → must survive
    position: moddle.create('pfdn:Coordinates', { x: 100, y: 20 })
  });
  const e1 = moddle.create('pfdn:Link', {
    id: 'e1',
    source: n1, // reference (String IDREF) → "n1"
    target: n2, // → "n2"
    waypoint: [
      moddle.create('pfdn:Coordinates', { x: 1, y: 2 }),
      moddle.create('pfdn:Coordinates', { x: 3, y: 4 })
    ]
    // pinned (false) left at default → omitted
  });
  const e2 = moddle.create('pfdn:Link', { id: 'e2', source: n2, target: n1, pinned: true });
  const settings = moddle.create('pfdn:Settings', {
    zoom: moddle.create('pfdn:Zoom', {
      offset: moddle.create('pfdn:Coordinates', { x: 5, y: 5 }),
      scale: 1
    })
  });
  const diagram = moddle.create('pfdn:Diagram', {
    id: 'D1',
    settings,
    node: [n1, n2],
    link: [e1, e2],
    label: [label],
    propertiesSet: [props]
    // zone left absent → the JSON must NOT carry `zone: []`
  });
  return { moddle, diagram };
}

describe('toJson', () => {
  it('omits defaults, collapses references to ids, and keeps non-default scalars', () => {
    const { diagram } = buildSharpModel();
    const doc = toJson(diagram) as unknown as Record<string, unknown>;

    expect(doc.$type).toBe('pfdn:Diagram');
    const nodes = doc.node as Record<string, unknown>[];
    // n1: all-default scalars omitted
    expect(nodes[0]).not.toHaveProperty('status');
    expect(nodes[0]).not.toHaveProperty('type');
    expect(nodes[0]).not.toHaveProperty('size');
    // references collapsed to id strings
    expect(nodes[0].label).toBe('l1');
    expect(nodes[0].propertiesSet).toBe('ps1');
    expect((nodes[0].position as Record<string, unknown>).$type).toBe('pfdn:Coordinates');
    // n2: present non-default scalars survive
    expect(nodes[1].status).toBe(2);
    expect(nodes[1].size).toBe(40);

    const links = doc.link as Record<string, unknown>[];
    expect(links[0].source).toBe('n1');
    expect(links[0].target).toBe('n2');
    expect(links[0]).not.toHaveProperty('pinned'); // default false omitted
    expect((links[0].waypoint as unknown[]).length).toBe(2);
    expect(links[1].pinned).toBe(true);

    // nested Zoom.offset present; genuinely-absent isMany collections absent
    const settings = doc.settings as Record<string, unknown>;
    expect((settings.zoom as Record<string, unknown>).offset).toMatchObject({ x: 5, y: 5 });
    expect(doc).not.toHaveProperty('zone');
  });
});

describe('round-trip gates', () => {
  it('gate 1 — JSON idempotence: toJson(fromJson(j)) deep-equals j', () => {
    const { diagram } = buildSharpModel();
    const j = toJson(diagram);
    const rebuilt = fromJson(j);
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    expect(toJson(rebuilt.value)).toEqual(j);
  });

  it('gate 2 — cross-format oracle: byte-identical toXML and equal toJson via XML vs JSON', async () => {
    const { moddle, diagram } = buildSharpModel();
    const j = toJson(diagram);

    // JSON path
    const fromJsonResult = fromJson(j);
    expect(fromJsonResult.ok).toBe(true);
    if (!fromJsonResult.ok) return;

    // XML path (the proven writer as ground truth)
    const xml = moddle.toXML(diagram);
    const { rootElement } = await moddle.fromXML(xml, 'pfdn:Diagram');

    expect(moddle.toXML(fromJsonResult.value)).toBe(xml);
    expect(toJson(fromJsonResult.value)).toEqual(toJson(rootElement));
  });

  it('resolves forward references to the SAME object (two-pass re-link)', () => {
    const { diagram } = buildSharpModel();
    const rebuilt = fromJson(toJson(diagram));
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    const root = rebuilt.value;
    const nodes = root.node as ModelElement[];
    const labels = root.label as ModelElement[];
    // n1.label (declared in node[]) re-links to the l1 in label[] — same instance
    expect(nodes[0].label).toBe(labels[0]);
    const links = root.link as ModelElement[];
    expect(links[0].source).toBe(nodes[0]);
    expect(links[0].target).toBe(nodes[1]);
  });
});

describe('validate — strict by default, collect all', () => {
  const diagram = (extra: Record<string, unknown>): unknown => ({
    $type: 'pfdn:Diagram',
    id: 'D1',
    ...extra
  });
  const keywords = (doc: unknown): string[] => {
    const r = validate(doc);
    return r.ok ? [] : r.errors.map((e) => e.keyword);
  };

  it('accepts an id-less canonical document (R4 regression)', () => {
    expect(validate({ $type: 'pfdn:Diagram' }).ok).toBe(true);
    // settings with an id-less Settings sub-element (as emptyModel/ensureSettings emit)
    const doc = diagram({ settings: { $type: 'pfdn:Settings' } });
    expect(validate(doc).ok).toBe(true);
  });

  it('rejects an unresolvable reference', () => {
    const doc = diagram({ node: [{ $type: 'pfdn:Node', id: 'n1', label: 'ghost' }] });
    expect(keywords(doc)).toContain('refResolvable');
  });

  it('rejects a reference resolving to the wrong type (complex-typed ref)', () => {
    const doc = diagram({
      // n1.label points at n2 (a Node), but label expects a Label
      node: [
        { $type: 'pfdn:Node', id: 'n1', label: 'n2' },
        { $type: 'pfdn:Node', id: 'n2' }
      ]
    });
    expect(keywords(doc)).toContain('refType');
  });

  it('accepts String-typed IDREFs (Link.source/target) without a target-type check', () => {
    const doc = diagram({
      node: [
        { $type: 'pfdn:Node', id: 'n1' },
        { $type: 'pfdn:Node', id: 'n2' }
      ],
      link: [{ $type: 'pfdn:Link', id: 'e1', source: 'n1', target: 'n2' }]
    });
    expect(validate(doc).ok).toBe(true);
  });

  it('rejects duplicate ids', () => {
    const doc = diagram({
      node: [
        { $type: 'pfdn:Node', id: 'dup' },
        { $type: 'pfdn:Node', id: 'dup' }
      ]
    });
    expect(keywords(doc)).toContain('uniqueId');
  });

  it('rejects a wrong scalar type', () => {
    const doc = diagram({ node: [{ $type: 'pfdn:Node', id: 'n1', size: 'big' }] });
    expect(keywords(doc)).toContain('type');
  });

  it('rejects a mis-placed element type', () => {
    const doc = diagram({ node: [{ $type: 'pfdn:Zone', id: 'z1' }] });
    expect(keywords(doc)).toContain('assignable');
  });

  it('rejects an unknown property (strict)', () => {
    const doc = diagram({ node: [{ $type: 'pfdn:Node', id: 'n1', bogus: 1 }] });
    expect(keywords(doc)).toContain('additionalProperties');
  });

  it('rejects an unknown or abstract $type', () => {
    expect(keywords(diagram({ node: [{ $type: 'pfdn:Bogus', id: 'x' }] }))).toContain('type');
    expect(keywords(diagram({ node: [{ $type: 'pfdn:Base', id: 'x' }] }))).toContain('type');
  });

  it('collects multiple errors at once', () => {
    const doc = diagram({
      node: [{ $type: 'pfdn:Node', id: 'n1', size: 'big', bogus: 1, label: 'ghost' }]
    });
    const r = validate(doc);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('lax mode drops an unresolvable reference instead of failing', () => {
    const doc = diagram({ node: [{ $type: 'pfdn:Node', id: 'n1', label: 'ghost' }] });
    expect(validate(doc, { lax: true }).ok).toBe(true);
  });
});

describe('fromJson / assertValid error contract', () => {
  it('fromJson returns a Result (never throws) on invalid data', () => {
    const r = fromJson({ $type: 'pfdn:Diagram', node: [{ $type: 'pfdn:Node', label: 'ghost' }] });
    expect(r.ok).toBe(false);
  });

  it('fromJson throws only on a non-object argument', () => {
    expect(() => fromJson('nope' as unknown as PfdnDocument)).toThrow(TypeError);
  });

  it('assertValid throws PfdnValidationError with the collected errors', () => {
    try {
      assertValid({ $type: 'pfdn:Diagram', node: [{ $type: 'pfdn:Node', size: 'big' }] });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(PfdnValidationError);
      expect((error as PfdnValidationError).errors.length).toBeGreaterThan(0);
    }
  });
});
