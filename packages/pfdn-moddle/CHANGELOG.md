# @d3-polytree/pfdn-moddle

## 0.2.0

### Minor Changes

- c342677: JSON adapter + generated runtime validator + typed documents (roadmap C11).

  An additive JSON path over the **same** moddle model — consumers get typed, validated
  documents without touching XML (roadmap O1 left this open). No new dependency.

  - **`@d3-polytree/pfdn-moddle`** — new `toJson`/`fromJson`, `validate`/`assertValid`, and
    generated typed document interfaces (`PfdnDocument`, `PfdnNode`, …), all on the existing
    main entry.
    - `toJson` walks the moddle `$descriptor` (references are stored non-enumerably and
      defaults on the prototype, so a plain `JSON.stringify` would silently drop both),
      reading raw own values and mirroring moddle-xml's writer predicate exactly — references
      collapse to id strings, defaults are omitted, so documents are small and hand-diffable.
    - A **dependency-free validator generated from `pfdn.json`** (a `generate-pfdn.mjs` emits a
      committed `pfdn.generated.ts` — a descriptor table + interfaces; a CI drift gate keeps it
      in lockstep with the schema). It is strict by default (rejects unknown properties/types,
      wrong scalar types, mis-placed element types, duplicate ids, and unresolvable/
      wrong-typed references) and collects **all** errors as a `Result` with JSON-Pointer paths;
      `{ lax: true }` drops unresolvable references instead.
    - `fromJson` validates first, then rebuilds the tree in two passes (create, then re-link
      references via the moddle setter), so forward references resolve correctly.
  - **`@d3-polytree/core`** — `loadModelFromJson(input, { lax? })`, the JSON twin of
    `loadModel`, reusing the same `ensureSettings`/`routeLinks` normalisation so a JSON-loaded
    model boots every component identically. It validates strictly and throws a
    `PfdnValidationError` on any violation — a deliberate, documented divergence from
    `loadModel`'s XML lax-tolerance (a JSON document is a new external contract); `{ lax: true }`
    restores the tolerant behaviour.

- cdc6008: Obstacle-avoiding orthogonal link routing + route pinning (roadmap C4).

  - **`@d3-polytree/core`** — a new pure, dependency-free `route/` module
    (`avoidObstacles`) nudges the orthogonal elbow around other nodes' bounding
    boxes; it is deterministic, bounded, and a no-op when nothing is in the way, so
    diagrams with clear channels route exactly as before. `computeLinkWaypoints` /
    `routeLinks` now take the node set and delegate to it. Link rerouting is driven
    by a single writer on `commandStack.changed` (once per transaction, symmetric
    across execute/undo/redo) — replacing the incident-only `node.updated`
    subscription — so a route stays correct when a _non-incident_ obstacle node
    moves or a node is created/deleted. Solved waypoints remain derived (recomputed,
    never captured), keeping `toXML` byte-identical across undo/redo.
  - **`@d3-polytree/pfdn-moddle`** — `pfdn:Link` gains a `pinned` boolean attribute
    (default `false`, omitted from XML when unset, so existing documents round-trip
    byte-identically). A pinned link keeps its authored waypoints and is skipped by
    the router (it degrades to the plain polyline).
  - **`@d3-polytree/editor`** — an `editor.setLinkPinned(id, pinned?)` method and a
    `link.pin` command (one undo step) toggle a link's pinned route.

## 0.1.0

### Minor Changes

- dfd1db2: Initial public release of the modernized d3-polytree v2 ecosystem: a TypeScript +
  ESM pnpm monorepo publishing the `@d3-polytree/*` packages with slim, modular D3 v7
  peer dependencies.

  - Engine: `@d3-polytree/canvas`, `@d3-polytree/pfdn-moddle`, `@d3-polytree/core`.
  - Components: `@d3-polytree/viewer`, `@d3-polytree/interactive-viewer`,
    `@d3-polytree/editor` (each also ships a self-contained UMD bundle).
  - Panels: `@d3-polytree/side-tabs`, `@d3-polytree/search-panel`,
    `@d3-polytree/properties-panel` (with compiled CSS).
  - Icon pack: `@d3-polytree/icons-amazon`.

  Note for the maintainer: this changeset bumps every package by a `minor` step
  (0.0.0 → 0.1.0). Edit it to `major` before running the release if the first
  public version should be 1.0.0 (or set the versions explicitly).
