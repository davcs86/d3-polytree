---
'@d3-polytree/element': patch
---

Remove the unused direct `@d3-polytree/viewer` dependency (never imported by `src`, absent from the
built `.d.ts`; the compiled shadow CSS is generated from `editor` + `interactive-viewer`).

Also declare the six D3 v7 slices as `peerDependencies` (required by the wrapped editor for the
ESM/CJS build; the UMD bundle inlines them), so ESM consumers get the standard peer-dependency prompt.
