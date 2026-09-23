---
'@d3-polytree/element': patch
---

Remove the unused direct `@d3-polytree/viewer` dependency (never imported by `src`, absent from the
built `.d.ts`; the compiled shadow CSS is generated from `editor` + `interactive-viewer`).
