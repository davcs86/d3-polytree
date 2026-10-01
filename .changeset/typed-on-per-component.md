---
'@d3-polytree/viewer': minor
'@d3-polytree/interactive-viewer': minor
'@d3-polytree/editor': minor
---

**Breaking (types):** `on()` / `off()` now accept only the events a component
actually emits. `Viewer` is generic over its event set — `Viewer` (none),
`InteractiveViewer` (`selection.changed`), `Editor` (`document.changed`,
`selection.changed`, `commandStack.changed`) — so a subscription that could never
fire is a compile error instead of a silent no-op. A `Viewer` composed with an
emitting module opts in via the type parameter, e.g.
`new Viewer<'selection.changed'>({ modules: [selectionModule] })`. New type
aliases: `ViewerEvent`, `InteractiveViewerEvent`, `EditorEvent`.
