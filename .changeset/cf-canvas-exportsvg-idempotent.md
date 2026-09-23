---
'@d3-polytree/canvas': patch
---

`getSvgString` now serializes a clone of the SVG node instead of the live node, so repeated
`exportSVG()` calls no longer accumulate an inlined-CSS `<style>` (or a stray `xlink` attr) on the live
DOM. Makes SVG export idempotent and side-effect-free for `viewer`, `element`, and `ssr`.
