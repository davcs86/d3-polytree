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
- **Chrome icons (core).** The former (never-ported) fontello icon font is replaced
  with inline SVG icons from [Lucide](https://lucide.dev) (the icon set behind
  shadcn/ui), vendored as a small typed registry in `core` (`createIcon` /
  `UiIconName`) — no icon font, no binary asset, no runtime dependency. The
  side-tab, search, properties, palette and close icons all render as accessible,
  `currentColor`-tinted inline SVG. Palette/side-tab entries now take a semantic
  `icon` key instead of the old `iconClassName` CSS class.
- **Closable side panel (interactive-viewer).** Clicking the already-active side
  tab now collapses the panel; the close "×" is visible again (inline SVG).
- **Editor toolbar (editor).** The palette toolbar CSS was never ported, leaving
  an invisible block of empty spans; `editor/style.css` now carries the palette
  styling.
- **Drag cursor (core + editor).** `Drag` toggles `cursor-grabbing` on the root
  layer for the duration of a gesture; the matching `cursor: move` rule ships in
  `editor/style.css`.
- **Multi-element drag (core).** Grabbing a member of a multi-selection no longer
  collapses the selection to that one element (d3-drag strips `ctrlKey`, so the
  drag-start `select()` was always a replace); the whole group now drags together.
  `Drag.beginDrag` / `Drag.endDrag` are exposed for this and are unit-testable.
