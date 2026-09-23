---
"@d3-polytree/viewer": patch
---

Move `eventemitter3` from `dependencies` to `devDependencies`: it is used only via `import type`
(erased at compile), so it should not ship as a runtime dependency of the published package.
