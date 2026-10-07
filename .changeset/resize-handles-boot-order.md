---
'@d3-polytree/editor': patch
---

Fix missing resize handles on nodes drawn when a diagram first loads: `ResizeElement` now subscribes to `outline.created` before the drawers render the initial model.
