---
'@d3-polytree/core': patch
'@d3-polytree/viewer': patch
'@d3-polytree/ssr': patch
'@d3-polytree/interactive-viewer': patch
'@d3-polytree/editor': patch
'@d3-polytree/element': patch
---

Keyboard-first accessibility for the diagram: `role="application"` with roving
focus, arrow-cone navigation, an Escape hatch out of application mode, an
`aria-live` announcer, per-element accessible names (`<title>`/`<desc>`, also in
SSR/`exportSVG` output), a forced-colors-aware focus ring, and reduced-motion-aware
zoom. AT forms-mode navigation is verified structurally (axe) and behaviourally
(Playwright); a manual screen-reader pass is recommended (tracked as ROADMAP C2.a).
