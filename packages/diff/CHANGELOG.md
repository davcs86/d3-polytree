# @d3-polytree/diff

## 0.1.0

### Minor Changes

- 02e77ae: Add `@d3-polytree/diff`: a pure, dependency-light structural diff over two
  `toJson`-canonical `.pfdn` documents. `diff(a, b)` returns a deterministic,
  totally-ordered `DiffOp[]` (added / removed / moved / retyped / reattached /
  modified) for review overlays and three-way merge helpers, DOM-free and
  moddle-free at runtime.

  Also adds a `@d3-polytree/pfdn-moddle/schema` subpath exporting the generated
  `SCHEMA`/`CONCRETE_TYPES` runtime tables (moddle-free), which the diff engine
  consumes to drive its schema walk off the single generated source of truth.

### Patch Changes

- Updated dependencies [02e77ae]
- Updated dependencies [02e77ae]
  - @d3-polytree/pfdn-moddle@0.3.0
