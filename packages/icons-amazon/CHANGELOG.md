# @d3-polytree/icons-amazon

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
