---
'@d3-polytree/react': patch
---

Declare the six D3 v7 slices as peer dependencies, and
`@d3-polytree/interactive-viewer` (whose `style.css` the README imports) as a
dependency, so strict installs resolve them.
