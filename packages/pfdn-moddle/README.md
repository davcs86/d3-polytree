# @d3-polytree/pfdn-moddle

The **`.pfdn`** (Process Flow Diagram Notation) model for the
[d3-polytree](https://github.com/davcs86/d3-polytree) v2 ecosystem — a
[`moddle`](https://github.com/bpmn-io/moddle) schema plus an XML reader/writer, and a **generated,
zero-dependency** JSON adapter (typed documents + a strict validator) over the same model.

## Install

```sh
pnpm add @d3-polytree/pfdn-moddle
```

Ships ESM + CJS + `.d.ts`. `moddle` and `moddle-xml` are regular runtime dependencies (installed, not
bundled into `dist`); the JSON adapter and its types are generated from the schema (`pfdn.json`) at
build time and carry **no runtime deps**.

## The model

The `pfdn:` namespace defines the element types the engine reads and writes:

| Type               | Role                                                                              |
| ------------------ | --------------------------------------------------------------------------------- |
| `pfdn:Diagram`     | Root document — holds `settings` and the element collection.                      |
| `pfdn:Node`        | A process node, drawn as an icon `<use>` keyed by its `type` and sized by `size`. |
| `pfdn:Link`        | A directed edge between nodes.                                                    |
| `pfdn:Label`       | Text attached to a node/link.                                                     |
| `pfdn:Zone`        | A grouping region.                                                                |
| `pfdn:Coordinates` | An `{ x, y }` point.                                                              |
| settings           | Author, name, zoom/offset, grid, status.                                          |

## Usage

### XML round-trip

```ts
import { createPfdnModdle } from '@d3-polytree/pfdn-moddle';

const moddle = createPfdnModdle();

const { rootElement } = await moddle.fromXML(pfdnXml); // parse (async → ParseResult)
const node = moddle.create('pfdn:Node', { id: 'n1', type: 'default' });
const xml = moddle.toXML(rootElement); // serialize (sync → string)
```

### Typed JSON (no XML)

The model round-trips through plain, typed JSON over the **same** moddle model, so documents can be
produced, validated, and loaded without touching XML:

```ts
import { toJson, fromJson, validate, type PfdnDocument } from '@d3-polytree/pfdn-moddle';

const doc: PfdnDocument = toJson(definitions); // refs collapse to ids, defaults omitted

const result = validate(doc); // strict — collects ALL errors, does not throw
if (!result.ok) {
  for (const err of result.errors) {
    console.error(err.instancePath, err.message); // instancePath is a JSON Pointer
  }
}

const parsed = fromJson(doc); // validates first; returns a Result (never throws on invalid data)
if (parsed.ok) {
  const rootElement = parsed.value; // the rebuilt moddle element tree
}
// fromJson(doc, { lax: true }) drops unresolvable references instead of rejecting them
```

To throw instead of branching on a `Result`, `assertValid(doc)` raises a `PfdnValidationError`
(carrying `.errors`) and narrows `doc` to `ValidatedPfdnDocument`. For a model extended with extra
moddle packages, pass the same packages to `createPfdnModdle(additionalPackages)` and to
`validate` / `fromJson` / `assertValid` via `{ packages }`, so JSON is checked against the extended
schema rather than the base one.

> **Strict JSON vs lax XML.** `moddle.fromXML` defaults to `lax: true` (override with
> `fromXML(xml, 'pfdn:Diagram', { lax: false })`), whereas `validate` / `fromJson` are **strict** by
> default. The same invalid document can therefore load from XML yet be rejected from JSON; pass
> `{ lax: true }` to `fromJson` / `validate` to tolerate unresolvable references.

### Schema tables (`./schema`)

The `@d3-polytree/pfdn-moddle/schema` subpath exposes the generated descriptor tables without pulling
`moddle` / `moddle-xml` into your runtime graph:

```ts
import { SCHEMA, CONCRETE_TYPES, type TypeInfo } from '@d3-polytree/pfdn-moddle/schema';

const node: TypeInfo = SCHEMA['pfdn:Node']; // { abstract, allTypesByName, properties }
CONCRETE_TYPES.includes('pfdn:Link'); // true
```

Pair it with [`@d3-polytree/core`](https://github.com/davcs86/d3-polytree/tree/main/packages/core)'s
`loadModelFromJson(doc)` to boot a diagram straight from a validated JSON document.

## API

| Export / Method                                   | Type                                                                | Description                                                                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createPfdnModdle(additionalPackages?, options?)` | `(Record<string, unknown>?, Record<string, unknown>?) → PfdnModdle` | Create the moddle instance (also the default export); `additionalPackages` (default `{}`) extends the base `pfdn` package.                                                            |
| `PfdnModdle`                                      | class                                                               | The `Moddle` subclass behind `createPfdnModdle`.                                                                                                                                      |
| `moddle.create(type, attrs?)`                     | `→ ModelElement`                                                    | Instantiate a model element.                                                                                                                                                          |
| `moddle.fromXML(xml, typeName?, options?)`        | `→ Promise<ParseResult>`                                            | Parse XML; `typeName` defaults to `'pfdn:Diagram'`, `options: FromXmlOptions` go to the moddle-xml reader (`lax` default `true`).                                                     |
| `moddle.toXML(element, options?)`                 | `→ string`                                                          | Serialize a model tree to XML.                                                                                                                                                        |
| `toJson(element)`                                 | `→ PfdnDocument`                                                    | Serialize a moddle element to plain JSON (refs collapse to ids, defaults omitted).                                                                                                    |
| `validate(doc, { lax?, packages? })`              | `→ Result<PfdnDocument>`                                            | Strict validation collecting every `ValidationError`; `lax` drops unresolvable refs; `packages` validates an extended schema.                                                         |
| `fromJson(doc, { lax?, packages? })`              | `→ Result<ModelElement>`                                            | Validate, then rebuild the moddle tree. Throws `TypeError` only for a non-object argument.                                                                                            |
| `assertValid(doc, { packages? })`                 | `asserts doc is ValidatedPfdnDocument`                              | Throw `PfdnValidationError` if invalid; otherwise narrow `doc`.                                                                                                                       |
| `PfdnValidationError`                             | class (`extends Error`)                                             | Thrown by `assertValid`; `errors: ValidationError[]`.                                                                                                                                 |
| Types                                             | type                                                                | `ModelElement`, `ParseResult`, `FromXmlOptions`, `Result`, `ValidationError`, `ValidatedPfdnDocument`, `PfdnDocument` and the per-element document types (`PfdnNode`, `PfdnLink`, …). |
| `SCHEMA` (`./schema`)                             | `Record<string, TypeInfo>`                                          | Generated per-type descriptor table (`abstract`, `allTypesByName`, `properties: PropInfo[]`).                                                                                         |
| `CONCRETE_TYPES` (`./schema`)                     | `string[]`                                                          | The non-abstract `pfdn:` types. The subpath also exports the `TypeInfo` / `PropInfo` types.                                                                                           |

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
