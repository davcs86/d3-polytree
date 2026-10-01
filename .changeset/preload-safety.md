---
'@d3-polytree/editor': patch
'@d3-polytree/element': patch
'@d3-polytree/react': patch
---

Safe before a diagram has loaded:

- `Editor.undo/redo/markSaved` are no-ops, and `canUndo/canRedo/isDirty` return
  `false`. They used to throw `no diagram loaded`.
- `<d3-polytree-editor>.value` and the React handle's `export()` return the last
  document handed in.
