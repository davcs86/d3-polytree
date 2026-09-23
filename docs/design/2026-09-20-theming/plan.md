# Implementation Plan: theming (C13)

Derived from the approved `design.md` (deep debate; 6 adversary rounds). Ordered for independent
verification. All paths/anchors verified during recon + debate. **Chrome-only** — no `@d3-polytree/core`
code change (the selection outline keeps its inline `stroke='red'` attr; CSS layers over it).

## Step 1 — `packages/interactive-viewer/src/_tokens.scss` (new shared token partial)

Author the token system as plain CSS in a Sass partial:

- **Primitives** `--pfd-palette-*`: one per DISTINCT current literal (light values verbatim) — `#5990bd`,
  `#ff4800`, `#333333`, `#808080`(gray), `#d3d3d3`(lightgray), `#cccccc`, `#eee`, `#555`, `#f5f5f5`, `#fafafa`,
  `#f0f0f0`, `#4d80a8`, `#9ecbff`, toast hexes, white.
- **Semantic `--pfd-color-*`** on `:root, :host` (base/light), with `color-scheme: light`:
  surface `#fafafa` · surface-raised `#ffffff` · surface-hover `#f0f0f0` · border-strong `#cccccc` · border-muted
  `#808080` · border-subtle `#d3d3d3` · text `#333333` · text-muted `#808080` · text-secondary `#555` · accent-ink
  `#5990bd` · accent-fill `#5990bd` · accent-fill-hover `#4d80a8` · selection `#ff0000` · list-item `#eee` ·
  list-item-hover `#f5f5f5` · toast-link `#9ecbff` · toast-success/warning/error/info (current hexes). `#ff4800`
  and `selection` are theme-INVARIANT (same value in every block).
- **`@media (prefers-color-scheme: dark)` { :root, :host { … } }** — re-declare the dark values from design.md
  (surface `#1e1e1e`, surface-raised `#252526`, surface-hover `#2d2d2d`, border-strong `#3c3c3c`, border-muted
  `#333333`, border-subtle `#2a2a2a`, text `#e4e4e4`, text-muted `#a0a0a0`, text-secondary `#c0c0c0`, accent-ink
  `#6fb0e0`, accent-fill `#5990bd`, accent-fill-hover `color-mix(in srgb, var(--pfd-color-accent-fill) 85%, black)`,
  list-item `#252526`, list-item-hover `#2d2d2d`, `color-scheme: dark`). NOT selection/`#ff4800`.
- **Attribute overrides, authored AFTER the `@media` block** (win by specificity):
  `:root[data-pfd-theme="dark"], :host([data-pfd-theme="dark"]) { …the dark block… }` and
  `:root[data-pfd-theme="light"], :host([data-pfd-theme="light"]) { …the light block… }` (forces light under a
  dark OS; needed by the export light-pin, Step 7). Factor the light/dark value sets via Sass mixins/maps to
  avoid triplicate hand-maintenance, but the EMITTED CSS must be the plain-hex declarations above.

## Step 2 — Import the partial (both aggregators, order-first)

- `packages/interactive-viewer/src/style.scss`: `@import './_tokens';` as the FIRST import (before outline/
  notifications/side-tabs/search).
- `packages/editor/src/style.scss`: `@import '../../interactive-viewer/src/_tokens';` FIRST (relative path
  resolves in dart-sass against the importing file's dir; no `--load-path`, no build-order dep — it is a source
  partial compiled inline by each package's existing `sass src/style.scss dist/style.css`). The duplicate
  `:root,:host` block in the concatenated `shadowCss` is byte-identical → harmless.

## Step 3 — Rewrite the ~50 color-bearing sites to `var(--pfd-*)`

Per the design's committed table, in these files (light value preserved exactly → VR baselines don't move):

- `interactive-viewer/src/search-panel/style.scss`: `.search` border `#333`→`var(--pfd-color-border-strong)`;
  `.list li` bg `#eee`→`list-item`, border-left `#5990bd`→`accent-ink`; `h3` `#333`→`text`; `p` `#555`→
  `text-secondary`; `:hover` `#f5f5f5`→`list-item-hover`.
- `interactive-viewer/src/notifications/style.scss`: toast bg `#333333`→`text`?? NO — toast bg is its own dark
  surface; map toast base bg to a `--pfd-color-toast-bg` (light+dark `#333333`), text `#fff` stays literal white,
  link `#9ecbff`→`toast-link`, severity bgs→toast-* tokens; dialog overlay/`rgba` stay literal; dialog bg `#fff`
  →`surface-raised`, text `#333333`→`text`; dialog-btn border `#cccccc`→`border-strong`, bg `#fafafa`→`surface`,
  hover `#f0f0f0`→`surface-hover`; dialog-OK bg/border `#5990bd`→`accent-fill`, text white literal, hover
  `#4d80a8`→`accent-fill-hover`.
- `interactive-viewer/src/side-tabs/style.scss`: container/tab bg `#fafafa`→`surface`, borders `#cccccc`/`#ccc`
  →`border-strong`, tab text `#333333`→`text`, `.active` `#ff4800`→`accent-invariant`(=`#ff4800`), content-title
  bg `#5990bd`→`accent-fill` + `color:white` literal, close `white` literal.
- `editor/src/palette.scss`: bg `#fafafa`→`surface`, border `#cccccc`→`border-strong`, entry `#333333`→`text`,
  `:hover` `#ff4800`→`accent-invariant`, group border `#cccccc`→`border-strong`.
- `editor/src/properties-panel/style/{style,_tabs,_groups}.scss`: pp-content border `gray`→`border-muted`, bg
  `#fff`→`surface-raised`; group border-bottom `lightgray`→`border-subtle`; scroll-tabs `gray`→`text-muted`;
  tab link bg `#fff`→`surface-raised`, border `lightgray`→`border-subtle`, `color:gray`→`text-muted`; tab-active
  border `gray`→`border-muted`, border-top `#5990bd`→`accent-ink`, `border-bottom:#fff`→`surface-raised` (seam
  mask — SAME token as pp-content bg), `color:#333`→`text`.
- Leave every `rgba(0,0,0,·)` shadow/overlay literal.

## Step 4 — Selection outline (`interactive-viewer/src/_outline.scss`); NO core change

- Add `.element-outline { stroke: var(--pfd-color-selection, #ff0000) }` (beats the inline `stroke='red'` attr,
  which is RETAINED at `core/src/features/outline.ts:73` for export neutrality — `outline.test.ts:40` unchanged).
- Keep the existing `stroke-width` toggles for `.selected`/`:hover`.

## Step 5 — forced-colors (`@media (forced-colors: active)`)

- `_outline.scss`: `.element-outline { stroke: Highlight; forced-color-adjust: none }` (selection stays visible).
- Focus rings on GENUINELY focusable chrome only: dialog `<button>`s (`notifications/style.scss`) and the search
  `<input>` (`search-panel/style.scss`) → `:focus-visible { outline: 2px solid Highlight }` under forced-colors.
- Panels/notifications/palette stay `forced-color-adjust: auto` (system remaps bg/text/border). No blanket
  `forced-color-adjust: none`. (Optional cheap polish: a `forced-colors` border on `.pfdjs-toast`/`.pfdjs-dialog`
  which today rely on box-shadow — noted, not required.)

## Step 6 — Regenerate the element's shadow CSS

`packages/element/scripts/generate-styles.mjs` re-runs in the element `build` (turbo `^build` orders the two
upstream `dist/style.css` first) and rewrites the committed `packages/element/src/styles.generated.ts` — the
`:root,:host` token block + `@media`/attribute blocks flow into `shadowCss` automatically. Do NOT hand-edit;
regenerate via build and commit the result.

## Step 7 — Export light-pin (`packages/element/src/index.ts`)

In `exportSVG`, on the captured `<svg …>` open tag (already rewritten via `svg.replace(/(<svg\b[^>]*>)/, …)`),
add `data-pfd-theme="light"`. The `_tokens.scss` pin block must include BOTH `:root[data-pfd-theme="light"]`
(matches the `<svg>` document root in standalone `data:`-URI consumption) AND `svg[data-pfd-theme="light"]`
(matches the exported root under inline-HTML consumption). The document-path (`Viewer.exportSVG` via
`SvgExportingUtils.ts`) needs no change — it skips `@media` at-rules (`:69`) and the retained `stroke='red'` attr
keeps a selected outline neutral.

## Step 8 — Storybook (`apps/storybook`)

- `.storybook/preview.ts`: add `globalTypes.theme` (auto/light/dark, toolbar) + a global decorator that stamps
  `data-pfd-theme` on **`document.documentElement`** for the explicit light/dark choices and REMOVES it for
  `auto` — the light/auto branch is a strict no-op (no `parameters.backgrounds`, no structural wrapper) so the
  10 existing baselines don't move.
- `playwright/_support.ts`: extend `gotoStory` with optional `colorScheme`/`forcedColors`, merged into a single
  `page.emulateMedia({ reducedMotion: 'reduce', colorScheme, forcedColors })` (Playwright merges; omitted keys
  unchanged).

## Step 9 — Tests / gates

- **VR** (`apps/storybook/playwright/vr.spec.ts` or a new `theme.spec.ts`): dark + forced-colors variants of the
  highest-chrome story (must include the SEARCH PANEL and properties-panel tabs), via `emulateMedia` and via the
  `data-pfd-theme` attribute (both dark paths, gate #4). New baselines auto-seed on first push; the 10 existing
  light baselines must remain unchanged.
- **Export neutrality** (gate #1): a test exporting a fixture WITH A SELECTED element under dark === under light
  — `Viewer.exportSVG` (document path) and `D3PolytreeEditorElement.exportSVG` (shadow path, carries the
  `data-pfd-theme="light"` stamp). Assert resolved/serialized colours with theme pinned, not raw string equality.
- **Model/XML untouched** (gate #2): import an explicit-`lineColor="#000000"` fixture, toggle dark,
  `exportDiagram()` → `toXML` byte-identical to pre-theme.
- **Shadow token self-containment** (gate #3): mount `<d3-polytree-editor>` with no host `:root` tokens → chrome
  themed (jsdom element test; may assert the token appears in the shadow root's adopted CSS).
- **a11y**: axe on the dark variant (text contrast); the non-text 1.4.11 cases are covered by the design's
  hand-computed ratios, not axe.

## Step 10 — Changeset + docs

- `.changeset/theming.md`: `@d3-polytree/interactive-viewer` **minor**, `@d3-polytree/editor` **minor**,
  `@d3-polytree/element` **patch** (regenerated `styles.generated.ts` + export light-pin). NOT core (no code
  change). NOT viewer (no CSS).
- `ROADMAP.md`: mark C13 ✅ shipped. `README.md`: a short "Theming" note (auto dark via `prefers-color-scheme`,
  manual `data-pfd-theme`, `--pfd-*` override tokens; diagram content stays as authored).

## Step 11 — Full local gate (mirror CI)

`pnpm install` (no new deps) → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build` (regenerates
`styles.generated.ts` — confirm it's committed & clean) → `pnpm build-storybook`. Then VR locally against the 10
existing baselines to PROVE zero light drift before pushing (the load-bearing pixel-stability claim). Reseed only
the new dark/forced-colors baselines.

## Traceability to debate findings

- Chrome-only + light canvas (Fork 3): Steps 3-5 touch only chrome CSS; no core/draw/model change.
- Plain-hex + @media + attribute, no light-dark() (R1/R3): Step 1.
- One-primitive-per-literal, pixel-stable light (R1/R2): Steps 1,3,11.
- Keep outline attr, layer CSS (R1): Step 4. Theme-invariant selection + `#ff4800` (R3/R5): Step 1.
- Accent fill/ink split (R3); search-panel trio (R4); `gray`/`lightgray`/`#333`/`#fff` roles (R5): Steps 1,3.
- Export `:root`+`svg[data-pfd-theme]` pin (R2/R4): Step 7. Decorator on documentElement, light no-op (R2/R5):
  Step 8. Focus rings on real focusables only (R2): Step 5.

## Review Log

Plan-review verdict: **PASSED-WITH-WARNINGS** (no blocker; every literal confirmed mapped, outline/core "no
change" verified, export neutrality confirmed both paths, Sass import mechanics compile). Warnings heeded in
implementation:

- **W1** — Step 1 must also define `--pfd-color-toast-bg` (INVARIANT `#333333`, `notifications:17` — mapping toast
  bg to `text` would make it near-white in dark) and `--pfd-color-accent-invariant` (INVARIANT `#ff4800`).
- **W2** — `.search` border `#333`→`border-strong` is NOT light-pixel-stable (`#333`→`#cccccc` in light); accepted
  as an intentional, more-consistent border treatment, safe because the search input is unpainted in the 10
  baselines (side-tab hidden by default). No light-baseline seeds a `#333` search border.
- **W3** — Step 1's attribute block must include `svg[data-pfd-theme="light"]` (the export inline-HTML pin), not
  only `:root`/`:host`.
- **W4** — `document.documentElement` stamping drives the raw-mount stories (all current baselines + the dark
  Editor story); an element-mount shadow story would need `emulateMedia({colorScheme:'dark'})` or a host-element
  stamp. Scope the attribute-decorator to raw-mount stories.
- **W5** — `@d3-polytree/element` changeset → **minor** (new backward-compatible dark/forced-colors + export attr).
- **N1** — cover the second `color: gray` at `_tabs.scss:54` (`a:hover`). **N2** — export stamp via
  `svg.replace(/<svg\b/, '<svg data-pfd-theme="light"')` (the existing `$1` captures the full tag incl. `>`, so a
  naive append fails). **N3** — import as `@import './tokens'` (underscore-less, repo convention).
