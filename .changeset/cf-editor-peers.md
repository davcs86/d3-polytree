---
"@d3-polytree/editor": patch
---

Declare the six D3 v7 slices as `peerDependencies` (required at runtime via `core`), and move
`eventemitter3` to `devDependencies` (used only via `import type`).
