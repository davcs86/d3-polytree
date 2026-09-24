# @d3-polytree/ssr

## 0.2.6

### Patch Changes

- 02e77ae: Keyboard-first accessibility for the diagram: `role="application"` with roving
  focus, arrow-cone navigation, an Escape hatch out of application mode, an
  `aria-live` announcer, per-element accessible names (`<title>`/`<desc>`, also in
  SSR/`exportSVG` output), a forced-colors-aware focus ring, and reduced-motion-aware
  zoom. AT forms-mode navigation is verified structurally (axe) and behaviourally
  (Playwright); a manual screen-reader pass is recommended (tracked as ROADMAP C2.a).
- Updated dependencies [02e77ae]
- Updated dependencies [02e77ae]
- Updated dependencies [02e77ae]
  - @d3-polytree/core@0.6.0
  - @d3-polytree/viewer@0.2.3

## 0.2.5

### Patch Changes

- 5bc151d: Correct the README: `jsdom` is a regular runtime dependency (installed, not bundled); only the
  `@d3-polytree/*` engine packages are bundled into `dist`.
- Updated dependencies [5bc151d]
- Updated dependencies [5bc151d]
- Updated dependencies [5bc151d]
- Updated dependencies [5bc151d]
  - @d3-polytree/canvas@0.2.2
  - @d3-polytree/core@0.5.2
  - @d3-polytree/viewer@0.2.2

## 0.2.4

### Patch Changes

- 8c75ec1: Docs: comprehensive per-package READMEs across the ecosystem.

  Every published package now ships a comprehensive README (install, feature/API tables, usage examples,
  where-it-fits notes, and links) so the npm package page is self-contained. `@d3-polytree/element` and
  `@d3-polytree/react` gain their first READMEs; the remaining nine are expanded to a consistent
  structure. Stale `homepage` links that pointed at a non-existent `v2` branch are corrected to `main`.
  No runtime or API changes — this is a docs/metadata-only release so the refreshed READMEs are
  republished to npm.

- Updated dependencies [8c75ec1]
  - @d3-polytree/canvas@0.2.1
  - @d3-polytree/core@0.5.1
  - @d3-polytree/viewer@0.2.1

## 0.2.3

### Patch Changes

- Updated dependencies [05f45d3]
- Updated dependencies [c342677]
- Updated dependencies [cdc6008]
  - @d3-polytree/viewer@0.2.0
  - @d3-polytree/core@0.5.0

## 0.2.2

### Patch Changes

- Updated dependencies [2898d3b]
- Updated dependencies [c659d32]
  - @d3-polytree/core@0.4.0
  - @d3-polytree/viewer@0.1.3

## 0.2.1

### Patch Changes

- Updated dependencies [aea734a]
- Updated dependencies [ca348c6]
  - @d3-polytree/core@0.3.0
  - @d3-polytree/viewer@0.1.2

## 0.2.0

### Minor Changes

- f9712bb: Deterministic ids + server-side rendering (C9).

  - **canvas:** `ElementRegistry` now resolves its id source through an injected
    `idGenerator` DI token (default `IdsIdGenerator`, backward-compatible). Adds
    the `IdGenerator` interface plus `IdsIdGenerator` (random, the prior default)
    and `SequentialIdGenerator` (deterministic `node_1`, `node_2`, … with author-id
    pre-claim) so consumers can swap in reproducible id generation.
  - **ssr (new package):** `@d3-polytree/ssr` exposes `renderToSvg(pfdnXml)` — hosts
    a read-only Viewer against a jsdom DOM wired to a deterministic id generator and
    returns a standalone SVG string in Node, with no real browser. Serial-only
    (a module-level mutex; installs DOM globals add-only and restores them), the
    basis for golden-file/visual-regression tests, thumbnails, and OG images.

### Patch Changes

- Updated dependencies [f9712bb]
- Updated dependencies [f9712bb]
  - @d3-polytree/canvas@0.2.0
  - @d3-polytree/core@0.2.0
  - @d3-polytree/viewer@0.1.1
