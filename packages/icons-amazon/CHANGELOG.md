# @d3-polytree/icons-amazon

## 0.1.6

### Patch Changes

- 5bc151d: Correct README inaccuracies: `@d3-polytree/core` is kept external at build (not bundled); and the
  curated `src/svg/` icons are not a key-for-key subset of `catalog/`, so copying catalogue files adds
  new `type` keys rather than promoting the same set with "no code change".
- Updated dependencies [5bc151d]
  - @d3-polytree/core@0.5.2

## 0.1.5

### Patch Changes

- 8c75ec1: Docs: comprehensive per-package READMEs across the ecosystem.

  Every published package now ships a comprehensive README (install, feature/API tables, usage examples,
  where-it-fits notes, and links) so the npm package page is self-contained. `@d3-polytree/element` and
  `@d3-polytree/react` gain their first READMEs; the remaining nine are expanded to a consistent
  structure. Stale `homepage` links that pointed at a non-existent `v2` branch are corrected to `main`.
  No runtime or API changes — this is a docs/metadata-only release so the refreshed READMEs are
  republished to npm.

- Updated dependencies [8c75ec1]
  - @d3-polytree/core@0.5.1

## 0.1.4

### Patch Changes

- Updated dependencies [c342677]
- Updated dependencies [cdc6008]
  - @d3-polytree/core@0.5.0

## 0.1.3

### Patch Changes

- Updated dependencies [2898d3b]
- Updated dependencies [c659d32]
  - @d3-polytree/core@0.4.0

## 0.1.2

### Patch Changes

- Updated dependencies [aea734a]
- Updated dependencies [ca348c6]
  - @d3-polytree/core@0.3.0

## 0.1.1

### Patch Changes

- Updated dependencies [f9712bb]
  - @d3-polytree/core@0.2.0

## 0.1.0

### Minor Changes

- dfd1db2: Initial public release of the modernized d3-polytree v2 ecosystem: a TypeScript +
  ESM pnpm monorepo publishing the `@d3-polytree/*` packages with slim, modular D3 v7
  peer dependencies.

  - Engine: `@d3-polytree/canvas`, `@d3-polytree/pfdn-moddle`, `@d3-polytree/core`.
  - Components: `@d3-polytree/viewer`, `@d3-polytree/interactive-viewer`,
    `@d3-polytree/editor` (each also ships a self-contained UMD bundle).
  - Panels: `@d3-polytree/side-tabs`, `@d3-polytree/search-panel`,
    `@d3-polytree/properties-panel` (with compiled CSS).
  - Icon pack: `@d3-polytree/icons-amazon`.

  Note for the maintainer: this changeset bumps every package by a `minor` step
  (0.0.0 → 0.1.0). Edit it to `major` before running the release if the first
  public version should be 1.0.0 (or set the versions explicitly).

### Patch Changes

- Updated dependencies [dfd1db2]
  - @d3-polytree/core@0.1.0
