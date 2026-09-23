---
"@d3-polytree/icons-amazon": patch
---

Correct README inaccuracies: `@d3-polytree/core` is kept external at build (not bundled); and the
curated `src/svg/` icons are not a key-for-key subset of `catalog/`, so copying catalogue files adds
new `type` keys rather than promoting the same set with "no code change".
