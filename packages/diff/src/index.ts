/**
 * `@d3-polytree/diff` — a pure, dependency-light structural diff over two
 * `toJson`-canonical `.pfdn` documents. `diff(a, b)` returns a deterministic,
 * totally-ordered `DiffOp[]` (added / removed / moved / retyped / reattached /
 * modified) for review overlays and three-way merge helpers. DOM-free and
 * moddle-free: it reads the generated schema tables via
 * `@d3-polytree/pfdn-moddle/schema`.
 */
export { diff, DiffError } from './diff';
export type { DiffOp, DiffKind, CollectionKind, Coord } from './diff';
