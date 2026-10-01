---
'@d3-polytree/viewer': minor
---

`importDiagram` is sequenced. An import superseded by a later
`importDiagram`/`createEmpty`, or by `destroy()`, resolves without rendering.
This fixes two bugs: overlapping imports where the slowest one won, and a
pending import booting a second engine after teardown (for example under React
StrictMode, or a custom-element disconnect).
