/**
 * JSON adapter + validator for the PFDN model — an additive path over the SAME
 * moddle model as the XML `fromXML`/`toXML` (roadmap C11 / O1).
 *
 * - `toJson` serializes a moddle element to a plain, typed {@link PfdnDocument}
 *   (references collapsed to id strings, defaults omitted — mirroring the XML writer).
 * - `validate` checks a plain JSON document against the schema, collecting ALL errors.
 * - `fromJson` validates then rebuilds the moddle tree (two-pass: create, then re-link
 *   references), returning a {@link Result}.
 *
 * The runtime shape is validated against the generated {@link SCHEMA} descriptor table;
 * `toJson` walks the live moddle `$descriptor` (a moddle element stores references
 * NON-enumerably and defaults on the prototype, so an enumerable-key walk would silently
 * drop both — the walk is descriptor-driven and reads raw own values).
 */
import pfdnPackage from './pfdn.json';
import { PfdnModdle } from './PfdnModdle';
import type { ModelElement } from './PfdnModdle';
import { SCHEMA, CONCRETE_TYPES } from './pfdn.generated';
import type { PropInfo, TypeInfo, PfdnDocument } from './pfdn.generated';

export type { PfdnDocument, PfdnElement } from './pfdn.generated';

const BUILTINS = new Set(['String', 'Boolean', 'Integer', 'Real']);

// ---------------------------------------------------------------------------
// SchemaSource — the schema view the validator/builder read (C14)
// ---------------------------------------------------------------------------

/**
 * The two reads {@link validate}/{@link buildTree} perform against schema. The
 * **base** provider wraps the committed generated tables (default path — byte
 * identical to before C14); the **live** provider projects a caller-extended
 * moddle's `$descriptor` on demand, so JSON round-trips extended models the way
 * XML already does (`fromXML` reads the live model). Selected by `opts.packages`.
 */
interface SchemaSource {
  isConcrete(type: string): boolean;
  typeInfo(type: string): TypeInfo | undefined;
}

/** Base provider — the committed generated `SCHEMA`/`CONCRETE_TYPES`, no allocation. */
const baseSchema: SchemaSource = {
  isConcrete: (type) => CONCRETE_TYPES.includes(type),
  typeInfo: (type) => SCHEMA[type]
};

/** Build a moddle from the base package plus any caller packages (cycle-free — no `./index`). */
function createModdle(packages?: Record<string, unknown>): PfdnModdle {
  return new PfdnModdle({ pfdn: pfdnPackage, ...(packages ?? {}) });
}

interface LiveDescriptorProperty extends DescriptorProperty {
  isId?: boolean;
  isSimple?: boolean;
}
interface LiveModdle {
  getType(name: string): { prototype: { $descriptor: LiveDescriptor } };
  getTypeDescriptor(name: string): { isAbstract?: boolean } | undefined;
}
interface LiveDescriptor {
  allTypesByName: Record<string, unknown>;
  properties: LiveDescriptorProperty[];
}

/**
 * Live provider — reduce a moddle's effective `$descriptor` to the generated
 * {@link TypeInfo}/{@link PropInfo} shape. Strict 6-field projection: carry
 * `isId` (id indexing), skip `isVirtual` (moddle keeps them; the generator does
 * not), and derive `isSimple` from {@link BUILTINS} — the SAME builtin set
 * moddle-xml's reader uses, so the element/simple decision matches XML for
 * every type incl. enums. `allTypesByName` is set membership only (both reads
 * are `.includes`), so live's ancestor-first order vs generated's self-first is
 * immaterial.
 */
export function liveSchema(moddle: PfdnModdle): SchemaSource {
  const m = moddle as unknown as LiveModdle;
  return {
    isConcrete: (type) => {
      const td = m.getTypeDescriptor(type);
      return !!td && !td.isAbstract;
    },
    typeInfo: (type) => {
      const td = m.getTypeDescriptor(type);
      if (!td) return undefined;
      const d = m.getType(type).prototype.$descriptor;
      return {
        abstract: !!td.isAbstract,
        allTypesByName: Object.keys(d.allTypesByName),
        properties: d.properties
          .filter((p) => !p.isVirtual)
          .map((p) => ({
            name: p.name,
            type: p.type,
            isMany: !!p.isMany,
            isReference: !!p.isReference,
            isId: !!p.isId,
            isSimple: BUILTINS.has(p.type)
          }))
      };
    }
  };
}

/** A single validation failure, addressed by a JSON Pointer. */
export interface ValidationError {
  /** JSON Pointer to the offending value (e.g. `/node/2/position/x`). */
  instancePath: string;
  /** Machine-readable failure kind (e.g. `type`, `refResolvable`, `additionalProperties`). */
  keyword: string;
  /** Human-readable description. */
  message: string;
}

/** Success carries the value; failure carries every collected {@link ValidationError}. */
export type Result<T> = { ok: true; value: T } | { ok: false; errors: ValidationError[] };

/** Thrown by {@link assertValid} (and `loadModelFromJson`) when a document is invalid. */
export class PfdnValidationError extends Error {
  readonly errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(
      `Invalid PFDN document: ${errors.length} error(s)\n` +
        errors.map((e) => `  ${e.instancePath || '/'}: ${e.message}`).join('\n')
    );
    this.name = 'PfdnValidationError';
    this.errors = errors;
  }
}

/** A {@link PfdnDocument} proven valid by {@link assertValid}. */
export type ValidatedPfdnDocument = PfdnDocument & { readonly __pfdnValidated: unique symbol };

// ---------------------------------------------------------------------------
// toJson — moddle element -> plain JSON document
// ---------------------------------------------------------------------------

interface DescriptorProperty {
  name: string;
  type: string;
  isMany?: boolean;
  isReference?: boolean;
  isVirtual?: boolean;
  default?: unknown;
}
interface Descriptor {
  properties: DescriptorProperty[];
}

const descriptorOf = (element: ModelElement): Descriptor =>
  (element as unknown as { $descriptor: Descriptor }).$descriptor;

const refId = (value: unknown): string => (value as { id: string }).id;

function toJsonElement(element: ModelElement): Record<string, unknown> {
  const out: Record<string, unknown> = { $type: element.$type };
  const record = element as unknown as Record<string, unknown>;
  for (const p of descriptorOf(element).properties) {
    if (p.isVirtual) continue;
    // Mirror moddle-xml's writer predicate EXACTLY: own, non-default, non-null,
    // non-empty. Read the RAW own value (never `element.get`, which materialises
    // an unset isMany prop as an own []).
    if (!Object.prototype.hasOwnProperty.call(element, p.name)) continue;
    const value = record[p.name];
    if (value === p.default) continue;
    if (value === null || value === undefined) continue;
    if (p.isMany) {
      if (!Array.isArray(value) || value.length === 0) continue;
      if (p.isReference) out[p.name] = value.map(refId);
      else if (BUILTINS.has(p.type)) out[p.name] = value.slice();
      else out[p.name] = value.map((v) => toJsonElement(v as ModelElement));
    } else if (p.isReference) {
      out[p.name] = refId(value);
    } else if (BUILTINS.has(p.type)) {
      out[p.name] = value;
    } else {
      out[p.name] = toJsonElement(value as ModelElement);
    }
  }
  return out;
}

/** Serialize a moddle element (typically a `pfdn:Diagram`) to a plain JSON document. */
export function toJson(element: ModelElement): PfdnDocument {
  return toJsonElement(element) as unknown as PfdnDocument;
}

// ---------------------------------------------------------------------------
// validate — plain JSON document -> Result (collect ALL errors)
// ---------------------------------------------------------------------------

interface DeferredRef {
  path: string;
  id: string;
  propType: string;
  propSimple: boolean;
}

function scalarMatches(value: unknown, type: string): boolean {
  if (type === 'String') return typeof value === 'string';
  if (type === 'Boolean') return typeof value === 'boolean';
  return typeof value === 'number';
}

/**
 * Validate a plain JSON document against the PFDN schema, collecting every error.
 *
 * Strict by default: unknown properties, unknown/abstract `$type`, wrong scalar
 * types, non-array `isMany`, duplicate ids, mis-placed element types, and
 * unresolvable references are all reported. Pass `{ lax: true }` to downgrade an
 * unresolvable reference to a silent drop (matching moddle's XML tolerance).
 */
export function validate(
  doc: unknown,
  opts: { lax?: boolean; packages?: Record<string, unknown> } = {}
): Result<PfdnDocument> {
  const errors: ValidationError[] = [];
  const ids = new Map<string, string>();
  const refs: DeferredRef[] = [];
  // Extended models are validated against the live moddle descriptor; the base
  // model against the committed generated tables (no moddle built).
  const schema = opts.packages ? liveSchema(createModdle(opts.packages)) : baseSchema;

  const scalar = (value: unknown, type: string, path: string): void => {
    if (!scalarMatches(value, type)) {
      errors.push({ instancePath: path, keyword: 'type', message: `expected ${type}` });
    }
  };

  const walk = (node: unknown, path: string, expectedType: string): void => {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
      errors.push({ instancePath: path, keyword: 'type', message: 'expected an object' });
      return;
    }
    const obj = node as Record<string, unknown>;
    const type = obj.$type;
    if (typeof type !== 'string' || !schema.isConcrete(type)) {
      errors.push({
        instancePath: `${path}/$type`,
        keyword: 'type',
        message: `unknown or missing $type${typeof type === 'string' ? ` "${type}"` : ''}`
      });
      return;
    }
    const info = schema.typeInfo(type);
    if (!info) return; // unreachable when isConcrete(type) is true
    if (!info.allTypesByName.includes(expectedType)) {
      errors.push({
        instancePath: `${path}/$type`,
        keyword: 'assignable',
        message: `${type} is not assignable to ${expectedType}`
      });
    }
    const props = new Map<string, PropInfo>(info.properties.map((p) => [p.name, p]));
    for (const key of Object.keys(obj)) {
      if (key !== '$type' && !props.has(key)) {
        errors.push({
          instancePath: `${path}/${key}`,
          keyword: 'additionalProperties',
          message: `unknown property "${key}"`
        });
      }
    }
    const idProp = info.properties.find((p) => p.isId);
    if (idProp) {
      const idValue = obj[idProp.name];
      if (typeof idValue === 'string') {
        if (ids.has(idValue)) {
          errors.push({
            instancePath: `${path}/${idProp.name}`,
            keyword: 'uniqueId',
            message: `duplicate id "${idValue}"`
          });
        } else {
          ids.set(idValue, type);
        }
      }
    }
    for (const p of info.properties) {
      const value = obj[p.name];
      if (value === undefined) continue;
      const ppath = `${path}/${p.name}`;
      if (p.isReference) {
        if (typeof value === 'string') {
          refs.push({ path: ppath, id: value, propType: p.type, propSimple: p.isSimple });
        } else {
          errors.push({
            instancePath: ppath,
            keyword: 'type',
            message: 'expected a reference id string'
          });
        }
      } else if (p.isMany) {
        if (!Array.isArray(value)) {
          errors.push({ instancePath: ppath, keyword: 'type', message: 'expected an array' });
          continue;
        }
        value.forEach((item, i) => {
          if (p.isSimple) scalar(item, p.type, `${ppath}/${i}`);
          else walk(item, `${ppath}/${i}`, p.type);
        });
      } else if (p.isSimple) {
        scalar(value, p.type, ppath);
      } else {
        walk(value, ppath, p.type);
      }
    }
  };

  walk(doc, '', 'pfdn:Diagram');

  // Pass 2 — resolve references now that every id is indexed.
  for (const ref of refs) {
    const targetType = ids.get(ref.id);
    if (targetType === undefined) {
      if (!opts.lax) {
        errors.push({
          instancePath: ref.path,
          keyword: 'refResolvable',
          message: `unresolved reference "${ref.id}"`
        });
      }
    } else if (
      !ref.propSimple &&
      !(schema.typeInfo(targetType)?.allTypesByName.includes(ref.propType) ?? true)
    ) {
      errors.push({
        instancePath: ref.path,
        keyword: 'refType',
        message: `reference "${ref.id}" resolves to ${targetType}, not assignable to ${ref.propType}`
      });
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true, value: doc as PfdnDocument };
}

/** Assert a document is valid, narrowing it to {@link ValidatedPfdnDocument}. */
export function assertValid(
  doc: unknown,
  opts: { packages?: Record<string, unknown> } = {}
): asserts doc is ValidatedPfdnDocument {
  const result = validate(doc, opts);
  if (!result.ok) throw new PfdnValidationError(result.errors);
}

// ---------------------------------------------------------------------------
// fromJson — plain JSON document -> moddle tree (validate-first, two-pass)
// ---------------------------------------------------------------------------

interface DeferredLink {
  element: ModelElement;
  name: string;
  id: string;
}

/**
 * Build a moddle tree from a validated document. Two passes: (1) recursively
 * `create` every element (children post-order) omitting references, indexing by
 * id; (2) re-link each reference via the moddle setter (non-enumerable storage).
 */
function buildTree(
  doc: PfdnDocument,
  opts: { packages?: Record<string, unknown> } = {}
): { root: ModelElement; moddle: PfdnModdle } {
  const moddle = createModdle(opts.packages);
  const schema = opts.packages ? liveSchema(moddle) : baseSchema;
  const index = new Map<string, ModelElement>();
  const deferred: DeferredLink[] = [];

  const create = (node: Record<string, unknown>): ModelElement => {
    const type = node.$type as string;
    const info = schema.typeInfo(type);
    if (!info) throw new TypeError(`no schema for $type "${type}"`);
    const attrs: Record<string, unknown> = {};
    const links: { name: string; id: string }[] = [];
    for (const p of info.properties) {
      const value = node[p.name];
      if (value === undefined) continue;
      if (p.isReference) {
        links.push({ name: p.name, id: value as string });
      } else if (p.isMany) {
        const arr = value as unknown[];
        attrs[p.name] = p.isSimple
          ? arr.slice()
          : arr.map((c) => create(c as Record<string, unknown>));
      } else if (p.isSimple) {
        attrs[p.name] = value;
      } else {
        attrs[p.name] = create(value as Record<string, unknown>);
      }
    }
    const element = moddle.create(type, attrs);
    const idProp = info.properties.find((p) => p.isId);
    if (idProp) {
      const idValue = attrs[idProp.name];
      if (typeof idValue === 'string') index.set(idValue, element);
    }
    for (const link of links) deferred.push({ element, name: link.name, id: link.id });
    return element;
  };

  const root = create(doc as unknown as Record<string, unknown>);
  for (const link of deferred) {
    const target = index.get(link.id);
    if (target) {
      (link.element as unknown as { set(name: string, value: unknown): void }).set(
        link.name,
        target
      );
    }
  }
  return { root, moddle };
}

/**
 * Validate then rebuild a moddle tree from a plain JSON document. Returns a
 * {@link Result}; never throws on invalid data (only on a non-object argument).
 * With `{ lax: true }`, unresolvable references are dropped rather than rejected.
 */
export function fromJson(
  doc: unknown,
  opts: { lax?: boolean; packages?: Record<string, unknown> } = {}
): Result<ModelElement> {
  if (typeof doc !== 'object' || doc === null) {
    throw new TypeError('fromJson expects a PFDN JSON document object');
  }
  const result = validate(doc, opts);
  if (!result.ok) return result;
  return { ok: true, value: buildTree(result.value, opts).root };
}
