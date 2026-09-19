---
'@d3-polytree/core': patch
---

Fix the Show/hide grid toggle, which appeared to do nothing. `Axes` inserted the
grid `<g class="axis">` at `:first-child`, but `BackgroundColor` also inserts its
opaque full-size `<rect>` at `:first-child` and boots first — so the grid ended
up *beneath* the background rect and was painted over. The grid rendered but was
never visible, so toggling its `display` had no perceptible effect. `Axes` now
inserts the grid just above the background rect (still below the diagram
content), so it renders and the toggle visibly works.
