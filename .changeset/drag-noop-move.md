---
'@d3-polytree/core': patch
---

Fix: a plain click on a node no longer pushes a zero-delta `element.move` onto
the undo stack. `Drag.notifyMovedSelected()` now commits only when the gesture
produced a net displacement (d3-drag reports a click as `start` + `end` with no
`drag` between, which previously committed a no-op move — making every click a
silent undo step).
