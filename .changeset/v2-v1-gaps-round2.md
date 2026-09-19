---
'@d3-polytree/interactive-viewer': minor
'@d3-polytree/editor': patch
---

Fix three more editor interaction bugs surfaced after the V2↔V1 gap work:

- **New / Save were no-ops (interactive-viewer, editor).** The engine's default
  `notifications` is the headless `ConsoleNotificationService`, which only logs
  and reports every confirmation as *cancelled* — so the palette's "New" never
  reached `createDiagram`, and "Save" persisted silently with no feedback. Adds a
  dependency-free DOM notifications UI (`DomNotifications` / `domNotificationsModule`)
  — transient toasts plus a modal confirm dialog — composed **last** by the
  interactive components so it wins the `notifications` token. (The beta bound
  this role to `sweetalert`; this is the modern, no-dependency replacement.)
- **Properties-panel inner tabs navigated on click (editor).** The Properties /
  Format tab labels were `<a href="#">`, so switching tabs appended a hash /
  history entry every time. The label is no longer a navigating link and the tab
  click is `preventDefault`-ed.
- **Newly added nodes were missing from the search panel (interactive-viewer).**
  The search index skipped elements with an empty caption, and a node's label
  text is set *after* its `node.created` fires, so freshly added nodes never
  appeared. The list now falls back to the element id when there is no caption
  yet and refreshes on `node.updated` / `link.updated`, so added and renamed
  elements show correctly.
