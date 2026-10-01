---
'@d3-polytree/core': minor
---

Palette actions surface their failures as an error notification instead of
dropping them. This covers `.pfdn`/SVG/PNG export, auto-layout, and New.
`Exporting.trigger('png')` now rejects when the SVG cannot be rendered; it used
to hang forever.
