# Recon: theming (C13)

**Created**: 2026-09-20
**Change**: C13 — tokenised colors with `color-mix()` derivations, a dark scheme, and `forced-colors`
support (B8's other half; the visual counterpart to C2). ROADMAP line 529; listed **independent** (541).
**Depth**: deep
**Affected areas**: `packages/interactive-viewer/src/**` + `packages/editor/src/**` (authored SCSS), the two
`sass` build scripts, the `./style.css` exports, `packages/element` (shadow-DOM CSS copy + exportSVG),
`packages/core/src/{features,draw}/**` (chrome color literals in JS), `apps/storybook` (theming decorator +
VR/a11y baselines), and `packages/canvas/src/SvgExportingUtils.ts` (export CSS inlining).

---

## Repo profile

pnpm + Turborepo; SCSS authored per panel-owning package, compiled by **dart-sass CLI** to `dist/style.css`
in each package `build` (`sass src/style.scss dist/style.css --no-source-map --style=compressed
--silence-deprecation=import`, `interactive-viewer/package.json:25`, `editor/package.json:25`). No PostCSS,
no CSS bundler, no custom-property tooling. Still on legacy `@import` (hence the deprecation silence).

## THE BLANK SLATE

A repo-wide grep for `var(`, `--<token>`, `color-mix`, `light-dark`, `prefers-color-scheme`,
`forced-colors` returns **zero hits in authored source** (`element/src/styles.generated.ts` is compiled
output). The only `@media` are two width breakpoints in side-tabs. No SCSS `$` color vars, no `:root`, no
dark-mode class/attr. **C13 is greenfield tokenisation.**

## THE CENTRAL BOUNDARY (data-driven vs chrome) — the load-bearing constraint

The diagram's color splits into two populations; the split is an architectural fact:

- **Diagram body = per-element model data or baked symbol source → CSS theming CANNOT reach it.**
  Links/Zones/Labels/Markers read color straight from the pfdn definition and write it as an **inline
  `style`/attr** literal every create/update; node icons and alert badges bake color into `<symbol>`
  source. A CSS var / `currentColor` / dark-mode CSS / `forced-colors` cannot override an inline literal
  fill without mutating the model or changing drawer code.
  - Link stroke/inner-stroke `Links.ts:58,68` ← `lineColor`/`fillColor` (inline `.style`, HIGH cascade)
  - Link arrowhead `Markers.ts:35-37` ← link colors (inline attr)
  - Zone fill/stroke/opacity `Zones.ts:41-43` ← `fillColor`/`border.lineColor`/`opacity` (inline `.style`)
  - Label text fill `Labels.ts:47` ← `color` (inline attr)
  - Node icon colors `Icons.ts:4` (fallback `#888`) + icon-pack SVG sources (baked symbol)
  - Alert badge colors `alertIcons.ts:18-39` (`#D8000C`/`#1F75FE`/`#4BB543`/`#F8CA00`, baked symbol)
- **Chrome = themeable, but in three sub-classes:**
  - (a) **model-settings-driven inline attrs** — background `backgroundColor.ts:51` ← `settings.backgroundColor`;
    grid `axes.ts:126` ← `settings.grid.lineColor`. Inline, settings-driven — CSS can't override without code.
  - (b) **hardcoded inline literals in JS** — selection outline `outline.ts:73` `.attr('stroke','red')`
    (the `_outline.scss` only toggles `stroke-width`, not color); link-preview `AddLinkTool.ts:44`
    `.style('stroke','black')`. To tokenise these you must edit **TS**, not SCSS.
  - (c) **class-based CSS (freely themeable today)** — all panels/notifications/palette/side-tabs/search,
    `.d3-tip`, `.element-outline` visibility, resize-handle classes, and palette icon tint via
    `currentColor` (`uiIcons.ts:71` + `palette.scss:27,42`) — the ONLY `currentColor` indirection in the repo.

## CSS-source inventory (recurring palette to tokenise)

7 authored SCSS files, all standalone (no shared partial, no variables file):
`interactive-viewer/src/{_outline,notifications/style,side-tabs/style,search-panel/style}.scss` (via
`src/style.scss`) and `editor/src/{properties-panel/style/{style,_tabs,_groups},palette,drag}.scss` (via
`src/style.scss`). Recurring literals: **`#5990bd`** (primary/accent blue, 5 sites), **`#ff4800`** (active/hover
orange, 2 sites: `side-tabs .active`, `palette :hover`), grays `#333/#555/#fafafa/#cccccc/#eee/#f5f5f5/gray/
lightgray`, whites, semantic toast colors (`#2e7d32/#b26a00/#c62828/#37474f`), and `rgba(0,0,0,·)`
shadows/overlays. `.d3-tip` and resize handles have NO color rule today.

## pfdn.json color defaults (the model-level colors a dark scheme must reconcile)

`Link.lineColor` **#000000** (`:364`), `Link.fillColor` **#ffffff** (`:376`), `Grid.lineColor` **#dddddd**
(`:137`), `Settings.backgroundColor` **#ffffff** (`:169`), `Label.color` **#303030** (`:213`),
`Border.lineColor` **#dddddd** (`:281`), `Zone.fillColor` **#dddddd** (`:320`, opacity `0.6`). `Node` has NO
color attr (icon-source-defined). moddle applies these on read, so an unstyled document arrives with concrete
hex already in the model → drawers emit those literals inline before any theme can intervene. **A default
`#000` link on a dark background is invisible unless the default itself is theme-aware.**

## Delivery mechanics (cascade priority)

Inline `.style()` (HIGHEST short of `!important`): links, zones, grid. Inline presentation attr (LOWEST — a
CSS rule/`var()` CAN override it): labels, markers, background, outline. Baked `<symbol>` source
(untouchable): node/alert icons. Class-based CSS (themeable): all chrome. `currentColor`: only palette UI
icons.

## Build → dist → shadow → export chain

- Per-package `sass src/style.scss → dist/style.css`; `./style.css` exports on interactive-viewer + editor
  only; editor consumers import BOTH. No shared partial — a token layer needs a new shared origin (a `:root`/
  `:host` block authored into each `style.scss`, or a shared partial `@use`d by both).
- **Shadow DOM** (`element/`): `generate-styles.mjs` concatenates both compiled `dist/style.css` into a
  committed `styles.generated.ts` (`shadowCss`), injected via `adoptedStyleSheets` or a `<style>` fallback
  (`index.ts:136-152`). **Tokens/`@media prefers-color-scheme`/`forced-colors` authored in panel SCSS flow
  into the shadow root automatically** (media queries evaluate against the top-level context even inside a
  shadow root; custom properties inherit through the boundary). But because the element inlines its OWN copy
  and never defines tokens itself, C13 must make tokens **self-contained** (authored in the SCSS, on
  `:root, :host`) rather than rely on a host-page `:root`.
- **Export leak risk** (`SvgExportingUtils.ts:40-84`): export walks `document.styleSheets`, inlines rules
  whose `selectorText` matches SVG ids/classes → theme CSS could **leak the viewer's current theme into a
  neutral export**, and grouped/`@media` at-rules are mis-handled (matcher keys on `selectorText` only). The
  element's `exportSVG` override (`index.ts:106-114`) injects `shadowCss` **wholesale** → a shadow dark theme
  leaks into the export. Keep theme rules from matching diagram-element selectors.

## Storybook / VR / a11y

No theming in Storybook today (`preview.ts` has only a controls matcher — no backgrounds/globalTypes/
decorators). VR: `playwright.config.ts` `maxDiffPixelRatio:0.02`, 1280×800, chromium, container-pinned
`v1.56.1`; **10 committed baselines** at `apps/storybook/playwright/__screenshots__/chromium/*-linux.png` —
**any color change moves every baseline** (VR workflow auto-seeds new stories on first push but gates changed
ones). a11y axe gate (serious/critical, baseline currently empty) — a poor-contrast dark scheme could trip
new rules. `gotoStory` (`_support.ts:55-57`) emulates `reducedMotion` but NOT `colorScheme`/`forcedColors` —
dark/forced-colors VR stories need `page.emulateMedia({ colorScheme:'dark' | forcedColors:'active' })`.

## Host conventions / hard rules

- **"CSS ships compiled"** (root `CLAUDE.md:100-102`): can't ship raw SCSS; every token change recompiles to
  `dist/style.css`. `interactive-viewer/style.css` = outline+notifications+side-tabs+search;
  `editor/style.css` = properties-panel+palette+drag; editor consumers import both.
- `styles.generated.ts` is generated+committed; don't hand-edit; turbo `^build` orders upstream CSS first.
- Cross-package tests read built `dist` — rebuild after SCSS edits.
- SSR export needs the compiled `dist/style.css` loaded in `document` or exported SVG is unstyled.

## Risks / not-found

- **Greenfield** — no token/dark/forced-colors precedent to mirror; must set the whole convention.
- **The data-body boundary** is the sharpest scope question: chrome-only theming is clean CSS; theming the
  diagram body (so a default `#000` link isn't invisible on dark) requires touching drawer code / model
  defaults / `currentColor` routing — a materially larger, riskier change.
- **Two chrome literals live in TS** (`outline.ts:73` red, `AddLinkTool.ts:44` black), not CSS — tokenising
  them (esp. for forced-colors `Highlight`) means editing the draw/features layer + its tests
  (`outline.test.ts:40` asserts `red`).
- **Export fidelity** — theme leak into exported SVG (document + shadow paths).
- **VR churn** — every baseline reseeds; dark/forced-colors coverage needs new stories + `emulateMedia`.
- **dart-sass `@import` deprecation** — introducing `@use`/module system interacts with the current
  `--silence-deprecation=import`.

## Recommended scope (debate forks)

1. **Token architecture** — token origin (a `:root, :host` block authored into each panel SCSS vs a shared
   partial `@use`d by both), naming (`--pfd-*`), and `color-mix()` derivation strategy (base palette →
   derived surfaces/borders/hovers). `@use` migration vs staying on `@import`.
2. **Dark scheme mechanism** — `@media (prefers-color-scheme: dark)` (auto) vs an explicit opt-in
   attribute/class (`[data-pfd-theme="dark"]`) vs BOTH (media default + attribute override, the robust
   pattern). Where the attribute lives given shadow DOM (`:host([...])` / host page).
3. **The diagram-body boundary (biggest fork)** — chrome-only (leave diagram colors as document data), or
   also make diagram DEFAULTS theme-aware (a default `#000` link → a token when the model carries no explicit
   color), which needs drawer/model changes. Decide what a dark theme is even allowed to recolor.
4. **forced-colors support** — which surfaces opt in (selection outline → system `Highlight`, focus rings,
   panels via `forced-color-adjust`), and how to handle the outline color literal that lives in TS.
5. **Export fidelity** — prevent theme CSS leaking into exported SVG (document + shadow exportSVG paths).
6. **Storybook/VR/a11y** — theming decorator + dark/forced-colors stories, `gotoStory` `emulateMedia`,
   baseline reseeding, a11y contrast on the dark scheme.
