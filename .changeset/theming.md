---
'@d3-polytree/interactive-viewer': minor
'@d3-polytree/editor': minor
'@d3-polytree/element': minor
---

Theming: CSS custom properties, dark mode, and forced-colors support (roadmap C13).

Chrome (panels, notifications, palette, side-tabs, search, selection outline) is now driven by a
tokenised `--pfd-*` colour system defined on `:root, :host` in a shared `_tokens.scss`. A **dark scheme**
follows the OS `prefers-color-scheme` automatically and can be forced per-instance with a
`data-pfd-theme="light" | "dark"` attribute; **`forced-colors` (high-contrast)** maps the selection outline
and focus rings to system colours. Light values equal the previous literals exactly, so existing light
rendering is unchanged. Colours are derived with `color-mix()` in the dark scheme.

The diagram body (nodes, links, zones, labels, icons) and the canvas backdrop are intentionally **not**
themed — those colours are the user's document data. Exports stay theme-invariant.

- **`@d3-polytree/interactive-viewer`** — the token system + dark/forced-colors rules for the outline,
  notifications, side-tabs, and search panels.
- **`@d3-polytree/editor`** — the palette and properties-panel chrome consume the same tokens.
- **`@d3-polytree/element`** — the tokens flow into the shadow root automatically; `exportSVG()` now pins
  the export to the light theme so a themed viewer never leaks into exported SVG.

Consumers can re-theme by overriding the `--pfd-color-*` custom properties, or set
`data-pfd-theme` on a container / the `<d3-polytree-editor>` element to force a scheme.
