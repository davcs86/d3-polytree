---
'@d3-polytree/pfdn-moddle': minor
'@d3-polytree/core': minor
---

JSON adapter: support caller-extended moddle packages. `validate`, `fromJson`,
`assertValid` (and core's `loadModelFromJson`) accept an optional `packages`
option; when supplied, the JSON path validates and rebuilds against the live
extended moddle descriptor — so JSON documents round-trip caller-extended models
the way XML already does. The default (no-`packages`) path is unchanged, reading
the committed generated schema tables.
