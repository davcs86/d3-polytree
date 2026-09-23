---
'@d3-polytree/interactive-viewer': patch
---

- `DomNotifications` renders `text` as textContent by default and only renders markup supplied via the
  dedicated `trustedHtml` field — closing an unguarded `innerHTML` path.
- Declare the six D3 v7 slices as `peerDependencies` (they are required at runtime via `core`).
- Move `eventemitter3` to `devDependencies` (used only via `import type`).
