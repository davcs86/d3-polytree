---
'@d3-polytree/core': minor
'@d3-polytree/viewer': patch
'@d3-polytree/interactive-viewer': patch
'@d3-polytree/editor': patch
---

Zoom-out level of detail for large diagrams (roadmap C10). On a diagram with at least 5,000 drawn elements, zooming out to a scale of 0.16 or less hides nodes and links (labels and zones stay painted) and leaving that range restores them synchronously; it follows the `culling` option (`culling: false` disables both). At fit-all the settled pan frame time drops from ≈150 ms to ≈17–33 ms on the 23k-element perf fixture. Clicks and double-clicks on hidden elements are resolved through the spatial index, so selection still works; hover, drag and resize need a painted element, so zoom in first. Selected (first 200), focused and just-created elements stay painted. `@d3-polytree/core` also exports the provisional `LOD_*` constants and sets a `data-pfd-lod` attribute on the container.
