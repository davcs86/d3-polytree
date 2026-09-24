---
'@d3-polytree/core': minor
'@d3-polytree/editor': patch
---

Coalesce consecutive property-panel text edits into a single undo step. Adds a
`CommandStack` merge seam — an optional `mergeKey` on `execute` plus an optional
`CommandHandler.merge(prev, next)` hook — so a debounced typing burst on one
field collapses to one transaction while every keystroke still updates the live
drawing. The editor's `element.updateProperties` implements the hook and keys the
burst by element + property + selection session, so re-selecting an element
starts a new, separately-undoable edit.
