---
"@d3-polytree/editor": patch
---

Fix the tsup library build to keep `@d3-polytree/interactive-viewer` external (it was omitted from the
`external` list, so the ESM/CJS bundle inlined all of the parent package). Also correct the README API
table (add `setLinkPinned`, `canUndo`, `canRedo`).
