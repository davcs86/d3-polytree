---
'@d3-polytree/interactive-viewer': minor
'@d3-polytree/editor': minor
'@d3-polytree/core': minor
---

Close seven V2↔V1 interaction/rendering gaps carried over from the v2.0-beta port:

- **Initial link routing (core).** Link waypoints are now routed to edge-docked,
  orthogonal paths at load time (`loadModel`) via the new draw-independent
  `computeLinkWaypoints` / `routeLinks` in `modelling/linkRouting.ts`. Previously
  the routing only ran on `node.moved` / `node.updated`, so links loaded as a
  straight centre-to-centre line and were only corrected after a drag — and never
  in the static Viewer, which has no modelling layer. `ModellingLinks` now
  delegates to the same pure geometry, keeping drag re-routing identical.
- **Selection outline (interactive-viewer).** The per-element `element-outline`
  rect is made visible on `.selected` / `:hover` again — the v2.0-beta outline CSS
  was never ported. Ships in `interactive-viewer/style.css`.
- **Side-tab icons (interactive-viewer).** The `pfdn-font` icon font is ported and
  shipped with `interactive-viewer/style.css` (copied to `dist/font/`), so the
  side-tab, search, properties and palette glyphs render instead of blank spans.
- **Closable side panel (interactive-viewer).** Clicking the already-active side
  tab now collapses the panel; the close "×" is also visible again (font).
- **Editor toolbar (editor).** The palette toolbar CSS was never ported, leaving
  an invisible block of empty spans; `editor/style.css` now carries the palette
  styling (glyphs come from the shared `pfdn-font`).
- **Drag cursor (core + editor).** `Drag` toggles `cursor-grabbing` on the root
  layer for the duration of a gesture; the matching `cursor: move` rule ships in
  `editor/style.css`.
- **Multi-element drag (core).** Grabbing a member of a multi-selection no longer
  collapses the selection to that one element (d3-drag strips `ctrlKey`, so the
  drag-start `select()` was always a replace); the whole group now drags together.
  `Drag.beginDrag` / `Drag.endDrag` are exposed for this and are unit-testable.
