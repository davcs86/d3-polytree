---
'@d3-polytree/pfdn-moddle': minor
'@d3-polytree/core': minor
'@d3-polytree/editor': minor
---

Obstacle-avoiding orthogonal link routing + route pinning (roadmap C4).

- **`@d3-polytree/core`** — a new pure, dependency-free `route/` module
  (`avoidObstacles`) nudges the orthogonal elbow around other nodes' bounding
  boxes; it is deterministic, bounded, and a no-op when nothing is in the way, so
  diagrams with clear channels route exactly as before. `computeLinkWaypoints` /
  `routeLinks` now take the node set and delegate to it. Link rerouting is driven
  by a single writer on `commandStack.changed` (once per transaction, symmetric
  across execute/undo/redo) — replacing the incident-only `node.updated`
  subscription — so a route stays correct when a *non-incident* obstacle node
  moves or a node is created/deleted. Solved waypoints remain derived (recomputed,
  never captured), keeping `toXML` byte-identical across undo/redo.
- **`@d3-polytree/pfdn-moddle`** — `pfdn:Link` gains a `pinned` boolean attribute
  (default `false`, omitted from XML when unset, so existing documents round-trip
  byte-identically). A pinned link keeps its authored waypoints and is skipped by
  the router (it degrades to the plain polyline).
- **`@d3-polytree/editor`** — an `editor.setLinkPinned(id, pinned?)` method and a
  `link.pin` command (one undo step) toggle a link's pinned route.
