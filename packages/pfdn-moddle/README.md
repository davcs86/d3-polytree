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

Pair it with [`@d3-polytree/core`](https://github.com/davcs86/d3-polytree/tree/main/packages/core)'s
`loadModelFromJson(doc)` to boot a diagram straight from a validated JSON document.

## API

- `createPfdnModdle()` / `PfdnModdle` — the moddle instance and its class.
- `moddle.create(type, attrs)`, `moddle.fromXML(xml)`, `moddle.toXML(element)` — standard moddle IO.
- `toJson(definitions)` → `PfdnDocument`, `fromJson(doc, opts?)` → `Result<element tree>` (validates first).
- `validate(doc)` → `Result` (`{ ok: true } | { ok: false, errors: [...] }`).
- Types: `PfdnDocument` and the per-element document types, all generated from the schema.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
