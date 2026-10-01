---
'@d3-polytree/core': minor
'@d3-polytree/editor': minor
---

Command-owned element `status` state machine. The draw layer and the live drag no
longer write `status`, so `execute → undo` is byte-identical for documents whose
elements carry no `status` attribute (previously undo left `status="2"`).
`element.move` / `element.resize` / `element.updateProperties` apply
`markModified` (`Persisted` → `Dirty`) and restore the exact prior status on
undo. New elements are now created `New` (the default, not serialized) instead of
`Persisted`. Soft-deleted (`status="3"`) elements are no longer redrawn when a
saved document is reopened. `ElementStatus` and `markModified` are exported.
