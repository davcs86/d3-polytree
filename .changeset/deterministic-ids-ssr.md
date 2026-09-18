---
'@d3-polytree/canvas': minor
'@d3-polytree/ssr': minor
---

Deterministic ids + server-side rendering (C9).

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
