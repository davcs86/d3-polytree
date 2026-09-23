---
"@d3-polytree/pfdn-moddle": patch
---

Correct README inaccuracies: `toXML` is synchronous and returns a `string` (not `await … { xml }`);
`fromJson` returns a `Result` (not a bare element tree); and `moddle`/`moddle-xml` are regular runtime
dependencies, not bundled into `dist`.
