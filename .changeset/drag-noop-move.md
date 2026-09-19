---
'@d3-polytree/core': patch
---

Fix two coupled selection/undo bugs around clicking a node:

- **No zero-delta move on the undo stack.** d3-drag reports a plain click as
  `start` + `end` with no `drag` between, so `Drag.notifyMovedSelected()` was
  committing an `element.move` whose `to` equals its `from` — a no-op that still
  landed on the undo stack, making every click a silent undo step. It now commits
  only when the gesture actually moved something.
- **A node click no longer clears its own selection.** The drawing-layer click
  handler emitted `background.click` (which clears the selection) for any click
  whose target was not the outline — including a click that bubbled up from a
  node's inner `<use>`/`<rect>`. Selecting a node by clicking it then immediately
  cleared it. The handler now ignores clicks that land on any drawn element
  (`.element` / `.element-outline`). This bug was previously masked by the no-op
  move above; removing that unmasked it, so both are fixed together.
