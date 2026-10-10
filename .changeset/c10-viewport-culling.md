---
'@d3-polytree/canvas': minor
'@d3-polytree/core': minor
'@d3-polytree/viewer': minor
'@d3-polytree/interactive-viewer': minor
'@d3-polytree/editor': minor
'@d3-polytree/element': patch
---

Viewport culling for large diagrams (roadmap C10). Diagrams with at least 5,000 drawn elements now hide elements outside the viewport (default on; opt out with `culling: false`), so panning and zooming stay smooth (zoomed far out, nodes and links are also hidden — see the zoom-out LOD changeset). Culled elements keep their `<g>`, accessible name and focusability, and exports never contain the transient `data-pfd-transient` attribute. Also: a node's accessible `<title>` now refreshes when the element is updated, and the palette places new elements at the viewport centre instead of relative to the first drawn element.
