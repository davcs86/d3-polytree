# @d3-polytree/diff

Pure **structural diff** of two `.pfdn` documents. Part of the
[d3-polytree](https://github.com/davcs86/d3-polytree) ecosystem — `diff(a, b)` returns a
deterministic, totally-ordered `DiffOp[]` (added / removed / moved / retyped / reattached / modified)
that a review overlay or three-way merge helper can render or apply. Pure TypeScript — **no DOM, no
D3, no moddle at runtime** — so it is unit-testable on plain-JSON fixtures.

## Install

```sh
pnpm add @d3-polytree/diff
```

**No peer dependencies.** It depends only on [`@d3-polytree/pfdn-moddle`](https://github.com/davcs86/d3-polytree/tree/main/packages/pfdn-moddle)
for the document types and the generated schema tables (imported from its pure `/schema` subpath — no
`moddle`/`moddle-xml` reaches your runtime graph).

## What's inside

| Export                                  | Kind     | Role                                                                                               |
| --------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `diff`                                  | function | `diff(a, b): DiffOp[]` — a deterministic, totally-ordered structural diff of two documents.        |
| `DiffError`                             | class    | Thrown when a document is not diffable (a collection member without an `id`, or mismatched roots). |
| `DiffOp`                                | type     | The op union: `added` · `removed` · `moved` · `retyped` · `reattached` · `modified`.               |
| `DiffKind` · `CollectionKind` · `Coord` | type     | The addressable element kinds and the collapsed coordinate leaf.                                   |

## Usage

```ts
import { diff } from '@d3-polytree/diff';
import { toJson } from '@d3-polytree/pfdn-moddle';

// Inputs must be `toJson`-canonical documents (references as id strings, defaults omitted).
const ops = diff(toJson(before), toJson(after));

// e.g. [
//   { op: 'moved',      kind: 'Node', id: 'n1', from: { x: 0, y: 0 }, to: { x: 40, y: 0 } },
//   { op: 'reattached', kind: 'Link', id: 'e1', from: { target: 'n2' }, to: { target: 'n3' } },
//   { op: 'modified',   kind: 'Node', id: 'n1', field: 'name', from: 'A', to: 'B' },
// ]
```

## API

`diff(a: PfdnDocument, b: PfdnDocument): DiffOp[]`

Elements are matched by `id` across the five id-keyed Diagram collections (`node`, `link`, `zone`,
`label`, `propertiesSet`) plus the Diagram root scalars (`status`, `name`). The op list is **totally
ordered**: Diagram-root ops first, then collections in the order `Node → Link → Zone → Label →
PropertiesSet`, elements within a collection sorted by `id`, and per surviving element
`retyped → reattached → moved → modified(waypoint) → modified(rest)` (remaining leaves in schema
property order). Scalar equality is NaN-safe, so identical documents diff to `[]`.

Contract and known limits:

- **Inputs must be `toJson`-canonical.** A non-canonical document (e.g. a hand-built one that spells a
  default value explicitly) can produce phantom `modified` ops; both real producers (`toJson`, and
  `fromXML` → `toJson`) are canonical.
- **Every collection member must carry an `id`** — a missing one throws `DiffError` (identity, not
  position, is what makes a semantic diff sound).
- **Scope.** `reattached` covers `Link.source`/`target` only; `Link.waypoint` is diffed as a
  `modified` op only for **pinned** links (an unpinned route is layout-derived output and is skipped).
  The `settings` subtree (viewport chrome) is out of scope for this release.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
