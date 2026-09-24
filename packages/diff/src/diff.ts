/**
 * Pure structural diff of two `toJson`-canonical `.pfdn` documents.
 *
 * Contract: both inputs are `@d3-polytree/pfdn-moddle` `toJson` output — every
 * reference is an id string and moddle defaults are omitted. Feeding a
 * non-canonical document (e.g. a hand-built one that spells a default value
 * explicitly) yields phantom `modified` ops; both real producers (`toJson`, and
 * `fromXML`→`toJson`) are canonical.
 *
 * Determinism: element leaf equality is NaN-safe; the op list is totally ordered
 * (see below), independent of document array order.
 */
import type { PfdnDocument } from '@d3-polytree/pfdn-moddle';
import { SCHEMA } from '@d3-polytree/pfdn-moddle/schema';

/** Element kinds that live in an id-keyed Diagram collection. */
export type CollectionKind = 'Node' | 'Link' | 'Zone' | 'Label' | 'PropertiesSet';
/** All addressable kinds (collections + the singleton Diagram root). */
export type DiffKind = CollectionKind | 'Diagram';

/** A collapsed `pfdn:Coordinates` leaf, exactly as `toJson` emits it. */
export interface Coord {
  x?: number;
  y?: number;
}

export type DiffOp =
  | { op: 'added'; kind: CollectionKind; id: string }
  | { op: 'removed'; kind: CollectionKind; id: string }
  | { op: 'moved'; kind: 'Node' | 'Zone' | 'Label'; id: string; from?: Coord; to?: Coord }
  | { op: 'retyped'; kind: 'Node'; id: string; from?: string; to?: string }
  | {
      op: 'reattached';
      kind: 'Link';
      id: string;
      from: { source?: string; target?: string };
      to: { source?: string; target?: string };
    }
  | { op: 'modified'; kind: DiffKind; id: string; field: string; from?: unknown; to?: unknown };

/** Thrown when a document is not diffable (missing id, or mismatched roots). */
export class DiffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiffError';
  }
}

type El = Record<string, unknown>;

/** Diagram collections, in the fixed emission order, with their base element type. */
const COLLECTIONS: { kind: CollectionKind; prop: string; typeName: string }[] = [
  { kind: 'Node', prop: 'node', typeName: 'pfdn:Node' },
  { kind: 'Link', prop: 'link', typeName: 'pfdn:Link' },
  { kind: 'Zone', prop: 'zone', typeName: 'pfdn:Zone' },
  { kind: 'Label', prop: 'label', typeName: 'pfdn:Label' },
  { kind: 'PropertiesSet', prop: 'propertiesSet', typeName: 'pfdn:PropertiesSet' }
];

/** Fields owned by a structural op (or scoped out), excluded from the generic `modified` walk. */
const CARVE_OUTS: Record<DiffKind, ReadonlySet<string>> = {
  Node: new Set(['type', 'position']),
  Zone: new Set(['position']),
  Label: new Set(['position']),
  Link: new Set(['source', 'target', 'waypoint']),
  PropertiesSet: new Set<string>(),
  Diagram: new Set(['settings', 'node', 'link', 'label', 'zone', 'propertiesSet'])
};

/** NaN-safe strict scalar equality (`NaN === NaN`, `+0 === -0`). */
function eq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b);
}

/** Structural equality over scalars, arrays, and plain objects, bottoming out in {@link eq}. */
function deepEq(a: unknown, b: unknown): boolean {
  if (eq(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const aArr = Array.isArray(a);
  if (aArr !== Array.isArray(b)) return false;
  if (aArr) {
    const x = a as unknown[];
    const y = b as unknown[];
    if (x.length !== y.length) return false;
    return x.every((v, i) => deepEq(v, y[i]));
  }
  const ao = a as El;
  const bo = b as El;
  const ak = Object.keys(ao);
  if (ak.length !== Object.keys(bo).length) return false;
  return ak.every((k) => Object.prototype.hasOwnProperty.call(bo, k) && deepEq(ao[k], bo[k]));
}

/** Index a collection's members by id, failing fast on a missing id. */
function indexById(items: unknown, kind: CollectionKind): Map<string, El> {
  const map = new Map<string, El>();
  if (items === undefined) return map;
  if (!Array.isArray(items)) {
    throw new DiffError(`${kind} collection is not an array`);
  }
  items.forEach((item, i) => {
    const el = item as El;
    const id = el?.id;
    if (typeof id !== 'string') {
      throw new DiffError(`${kind}[${i}] has no id (diff requires id-bearing documents)`);
    }
    map.set(id, el);
  });
  return map;
}

/** The property-declaration order for a base type's generic `modified` walk. */
function modifiedFields(typeName: string, kind: DiffKind): string[] {
  const info = SCHEMA[typeName];
  const carve = CARVE_OUTS[kind];
  if (!info) return [];
  return info.properties.filter((p) => !p.isId && !carve.has(p.name)).map((p) => p.name);
}

/** Emit the ops for one surviving element, in the fixed per-element order. */
function compareElement(
  kind: CollectionKind,
  typeName: string,
  id: string,
  a: El,
  b: El
): DiffOp[] {
  const ops: DiffOp[] = [];

  // retyped — Node.type
  if (kind === 'Node' && !eq(a.type, b.type)) {
    ops.push({ op: 'retyped', kind: 'Node', id, from: a.type as string, to: b.type as string });
  }

  // reattached — Link endpoints (only the changed endpoint(s) appear)
  if (kind === 'Link' && (!eq(a.source, b.source) || !eq(a.target, b.target))) {
    const from: { source?: string; target?: string } = {};
    const to: { source?: string; target?: string } = {};
    if (!eq(a.source, b.source)) {
      from.source = a.source as string;
      to.source = b.source as string;
    }
    if (!eq(a.target, b.target)) {
      from.target = a.target as string;
      to.target = b.target as string;
    }
    ops.push({ op: 'reattached', kind: 'Link', id, from, to });
  }

  // moved — position
  if ((kind === 'Node' || kind === 'Zone' || kind === 'Label') && !deepEq(a.position, b.position)) {
    ops.push({ op: 'moved', kind, id, from: a.position as Coord, to: b.position as Coord });
  }

  // pinned-link waypoints — a user-authored route change (unpinned waypoints are C4 output)
  if (
    kind === 'Link' &&
    (a.pinned === true || b.pinned === true) &&
    !deepEq(a.waypoint, b.waypoint)
  ) {
    ops.push({ op: 'modified', kind, id, field: 'waypoint', from: a.waypoint, to: b.waypoint });
  }

  // generic modified — every remaining leaf, in SCHEMA property-declaration order
  for (const field of modifiedFields(typeName, kind)) {
    if (!deepEq(a[field], b[field])) {
      ops.push({ op: 'modified', kind, id, field, from: a[field], to: b[field] });
    }
  }
  return ops;
}

/**
 * Diff two `toJson`-canonical `.pfdn` documents into a deterministic, totally
 * ordered `DiffOp[]`.
 *
 * Ordering: Diagram-root ops first, then collections in the order
 * `[Node, Link, Zone, Label, PropertiesSet]`; within a collection elements are
 * sorted by id; per surviving element the ops emit as
 * `retyped → reattached → moved → modified(waypoint) → modified(rest)`.
 *
 * @throws {DiffError} on a missing collection-member id or mismatched root ids.
 */
export function diff(a: PfdnDocument, b: PfdnDocument): DiffOp[] {
  const da = a as unknown as El;
  const db = b as unknown as El;
  if (da.id !== db.id) {
    throw new DiffError(`root id mismatch: "${String(da.id)}" vs "${String(db.id)}"`);
  }

  const ops: DiffOp[] = [];
  const rootId = typeof da.id === 'string' ? da.id : '';

  // Diagram root scalars (status/name) — carve-outs remove settings + collections.
  for (const field of modifiedFields('pfdn:Diagram', 'Diagram')) {
    if (!deepEq(da[field], db[field])) {
      ops.push({
        op: 'modified',
        kind: 'Diagram',
        id: rootId,
        field,
        from: da[field],
        to: db[field]
      });
    }
  }

  for (const { kind, prop, typeName } of COLLECTIONS) {
    const aMap = indexById(da[prop], kind);
    const bMap = indexById(db[prop], kind);
    const ids = [...new Set([...aMap.keys(), ...bMap.keys()])].sort();
    for (const id of ids) {
      const ea = aMap.get(id);
      const eb = bMap.get(id);
      if (ea && !eb) {
        ops.push({ op: 'removed', kind, id });
      } else if (!ea && eb) {
        ops.push({ op: 'added', kind, id });
      } else if (ea && eb) {
        ops.push(...compareElement(kind, typeName, id, ea, eb));
      }
    }
  }
  return ops;
}
