# CLAUDE.md — @d3-polytree/core

Package-specific notes; see the repo-root `CLAUDE.md` for the DI model, boot-order invariant, and
jsdom shims (all most relevant here).

The engine. Source layout: `draw/` · `model/` · `modelling/` · `features/*`, plus `Diagram.ts` (the
didi bootstrap) and `index.ts` (re-exports everything + per-feature `*Module` objects).

- **Adding a drawer:** subclass the draw base, subscribe to `<class>.created` / `<class>.updated` on
  the eventBus, render into your layer, and register the selection in `DrawingRegistry`. Export a
  `xModule` (`{ __init__: ['x'], x: ['type', X], __depends__: [...] }`) and place it in the component's
  module list **before the existing drawers** if it must see the initial model (root `CLAUDE.md`,
  boot-order rule).
- **Element class** comes from `getLocalName(definition)` (strips the `pfdn:` moddle `$type`), not from
  a JS `instanceof`.
- `IconLoader` parses each icon SVG into a `<symbol>` in the shared `<defs>`, **namespaces internal
  ids** (`<key>_<id>`) to avoid collisions, and always injects a `default` fallback symbol — so
  `symbolHref('anything')` resolves even for an unknown `type`.
- The eventBus is a single `eventemitter3` instance provided by `canvasModule`; every feature injects
  the same one. Model tokens (`d3polytree.definitions` / `.moddle`) are resolved off the running
  component, which registers itself as the `d3polytree` value.
- D3 slices are **peer** deps — import from the specific `d3-*` package, never a `d3` bundle.
