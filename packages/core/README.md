# @d3-polytree/core

The diagram **engine** for the d3-polytree v2 ecosystem. Wires the base canvas
([`@d3-polytree/canvas`](../canvas)) and the PFDN model ([`@d3-polytree/pfdn-moddle`](../pfdn-moddle))
into the didi module stack the components build on, running on slim, modular **D3 v7** peer deps.

Contains:

- **`draw`** — the drawers (nodes, links, labels, zones), icons + icon loader, markers, `<defs>`, and
  the drawing registry.
- **`model`** — the model provider (with settings normalisation).
- **`modelling`** — the four element handlers and the create/save/delete orchestrator.
- **`features/*`** — pan/zoom, grid/axes, background, mouse events, selection, outline, drag, export,
  localStorage, upload, the palette (toolbar + add-handlers + link tool), resize, tooltip,
  notifications.

Most users consume the engine through a component ([`viewer`](../viewer),
[`interactive-viewer`](../interactive-viewer), [`editor`](../editor)) rather than directly; each
feature is a didi module you can also compose à la carte. See it running in the
**[live Storybook](https://davcs86.github.io/d3-polytree/)** (the component and Guides/Kitchensink
stories exercise the engine end to end).

**Peer dependencies:** `d3-selection`, `d3-zoom`, `d3-transition`, `d3-scale`, `d3-axis`, `d3-drag`.

Part of the [d3-polytree](https://github.com/davcs86/d3-polytree) monorepo.

## License

MIT
