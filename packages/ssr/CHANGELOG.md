# @d3-polytree/ssr

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
