---
'@d3-polytree/element': minor
'@d3-polytree/react': minor
---

Both adapters accept extra didi `modules` (icon packs, custom features): a
`modules` JS property on `<d3-polytree-editor>` and a `modules` prop on
`<PolytreeEditor>`. A different array after mount reboots the engine in place and
re-imports the current document (undo/selection reset); arrays are compared by
identity.
