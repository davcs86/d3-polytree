# CLAUDE.md — @d3-polytree/pfdn-moddle

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

The `.pfdn` (Process Flow Diagram Notation) model — a [`moddle`](https://github.com/bpmn-io/moddle)
schema plus XML read/write. No rendering here.

- The schema is `src/pfdn.json`; types are `pfdn:Diagram`, `Node`, `Link`, `Label`, `Zone`,
  `Coordinates`, plus settings. `createPfdnModdle()` → `moddle.create(...)`, `fromXML`, `toXML`.
- **`Node.label` is an IDREF** (`isReference`), not a string. Assigning a raw string does not serialize
  correctly — pass the actual `pfdn:Label` object, or hand-author the `label="<id>"` attribute in XML.
  `Node.size` defaults to 25 and `Node.type` to `"default"` (moddle defaults apply on read).
- Owns the original mocha/chai-era test suite, ported to Vitest. Depends on `moddle` + `moddle-xml`
  only; no D3.
