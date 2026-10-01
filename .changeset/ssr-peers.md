---
'@d3-polytree/ssr': minor
---

Declare the six D3 v7 slices as peer dependencies and correct the README: the
engine packages are regular dependencies (not bundled), and their D3 slices must
be resolvable by the consumer.
