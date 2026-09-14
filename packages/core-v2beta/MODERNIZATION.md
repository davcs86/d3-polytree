# @d3-polytree/core-v2beta — modernization status

**Parked staging import (Track B / B1).** The entire `v2.0-beta` branch was imported whole
via `git subtree`, full history preserved (`git blame` resolves to the original authors).
`git-filter-repo` (which would let each `lib/*` subtree land as its own package directly) was
not available, so the repo is imported whole and split later.

Parked exactly like the other imports: original manifest kept as
[`package.json.legacy`](./package.json.legacy); replaced with a private, dependency-free,
script-less stub; directory excluded from the modern ESLint config.

**Next (B2–B5):**
- **B2** — split `lib/base/core` into `@d3-polytree/canvas` (de-duplicated with `d3-canvas`);
  wire `workspace:*` to `@d3-polytree/pfdn-moddle`.
- **B3** — carve `lib/Viewer.js` / `lib/InteractiveViewer.js` / `lib/Editor.js` (+ shared
  `lib/draw`, `lib/features`, `lib/modelling`) into `@d3-polytree/{core, viewer,
  interactive-viewer, editor}`; migrate the build to Vite/tsup.
- **B4** — TypeScript migration.
- **B5** — modular D3 v1 → v7 (drop the vendored `assets/d3`).

## B2 update

`lib/base/core` (Canvas / ElementRegistry / ElementBuilder / SvgExportingUtils) was **removed**
here and de-duplicated into **`@d3-polytree/canvas`** (the single source of truth). When this
package is un-parked (B3), it will consume `@d3-polytree/canvas` as a `workspace:*` dependency
instead of its former vendored copy.
