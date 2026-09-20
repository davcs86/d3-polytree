---
'@d3-polytree/canvas': patch
'@d3-polytree/pfdn-moddle': patch
'@d3-polytree/core': patch
'@d3-polytree/layout': patch
'@d3-polytree/viewer': patch
'@d3-polytree/interactive-viewer': patch
'@d3-polytree/editor': patch
'@d3-polytree/icons-amazon': patch
'@d3-polytree/ssr': patch
'@d3-polytree/element': patch
'@d3-polytree/react': patch
---

Docs: comprehensive per-package READMEs across the ecosystem.

Every published package now ships a comprehensive README (install, feature/API tables, usage examples,
where-it-fits notes, and links) so the npm package page is self-contained. `@d3-polytree/element` and
`@d3-polytree/react` gain their first READMEs; the remaining nine are expanded to a consistent
structure. Stale `homepage` links that pointed at a non-existent `v2` branch are corrected to `main`.
No runtime or API changes — this is a docs/metadata-only release so the refreshed READMEs are
republished to npm.
