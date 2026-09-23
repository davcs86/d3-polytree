<!-- context-forge:behavioral-contract:start -->

## How to Act

1. **Don't assume — ask, and surface tradeoffs.** _(enforced by `VIEWER-02` — the `on()` rebind surface; `PLAT-03`)_
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** _(enforced by `VIEWER-01` — reboot routes through non-virtual `_teardown()`)_
4. **Define success up front, then loop until verified.** _(enforced by `PLAT-06` determinism)_

<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->

> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · defects: [`docs/context-constitution-findings.md`](docs/context-constitution-findings.md) · inherits the root constitution. Forged by context-forge.

<!-- context-forge:constitution-pointer:end -->

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
