---
'@d3-polytree/canvas': minor
'@d3-polytree/core': minor
'@d3-polytree/editor': minor
---

Save gets a restore path and a real save point. The palette gains **Restore saved
diagram** (re-opens what **Save** stored in `localStorage`, after a confirmation);
`LocalStorage.restore()` and `readSavedDiagram()` are exported, and the Editor adds
`restoreSaved()`, `markSaved()`, `isDirty()` plus an opt-in `restoreSaved` option
that opens the saved diagram at boot. `CommandStack` records a save point
(`markSaved()` / a new `document.saved` event): `document.changed`'s `dirty` now
means "changed since the last save" — undo/redo back to the save point is clean —
instead of "has anything to undo". Save no longer reports success after a failed
`localStorage` write.
