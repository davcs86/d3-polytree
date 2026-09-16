# CLAUDE.md — @d3-polytree/viewer

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

The static, read-only viewer and the base class of the other components.

- `Viewer.modules` is just the four draw modules (labels, zones, links, nodes). `Viewer._boot(host)`
  builds the injector from `getModules()` + `options.modules` (caller extensions, **last**) + a
  `d3polytree` value module (this instance) — this is the one place the extension seam is wired, so
  subclasses override `getModules()`, not `_boot`.
- Public API: `importDiagram(xml)`, `createEmpty()`, `exportDiagram()` (→ `.pfdn`), `exportSVG()`,
  `get(token)`, `destroy()`. `options` accepts `{ container, modules }` (`ViewerOptions`).
- Ships a second **UMD** tsup pass (global `d3PolytreeViewer`); see root `CLAUDE.md`.
