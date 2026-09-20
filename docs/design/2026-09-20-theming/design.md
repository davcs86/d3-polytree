# Design: theming (C13)

**Created**: 2026-09-20
**Depth**: deep — 3-proposer panel (minimal-delta / target-state / operational-safety) + **6 adversary rounds**
(the cap). Verdicts: R1 SOUND-WITH-FIXES (3 major), R2 SOUND-WITH-FIXES, R3 SOUND-WITH-FIXES (4 major, WCAG
computed by hand), R4 SOUND-WITH-FIXES (1 major), R5 SOUND-WITH-FIXES (1 major + definitive exhaustive literal
table), R6 SOUND-WITH-FIXES (2 doc-consistency minors). The architecture was stable from round 1; rounds 3-6
completed the dark palette and reconciled the doc. Approved at the cap.
**Change**: tokenised colors (`--pfd-*`) with `color-mix()` derivations, a dark scheme, and `forced-colors`
support — the visual counterpart to C2 (ROADMAP C13). **Chrome-scoped.**
**Affected**: `packages/interactive-viewer/src/**` + `packages/editor/src/**` (SCSS + a new shared
`_tokens.scss`), `packages/core/src/features/outline.ts` (+`_outline.scss`), `packages/element/src/index.ts`
(export light-pin) + `scripts/generate-styles.mjs` (regenerate), `apps/storybook` (theming decorator + VR/a11y).

## Problem & the load-bearing constraint

C13 needs tokenised colors, a dark scheme, and forced-colors support. The blank slate is total: zero tokens /
`@media`-color / `color-mix` / `prefers-color-scheme` / `forced-colors` in authored source. The **hard
constraint** is the data-vs-chrome color boundary: the diagram body (links `draw/Links.ts:58,68` `.style()`,
zones `Zones.ts:41-43`, labels `Labels.ts:47`, markers `Markers.ts:35-37`, node icons `Icons.ts:4`, alert badges
`alertIcons.ts:18-39`) is coloured by **inline literals from the user's document model or baked `<symbol>`
source** — CSS cannot reach it without a no-op (`.style()` is high-cascade), mutating the model (breaking the
byte-identical `toXML` contract the ledger guards), or breaking export fidelity. Chrome (panels/notifications/
palette/side-tabs/search + the selection outline) is class-based CSS and themeable.

## Approach

### Fork 1 — Token architecture (chrome-scoped)
A new shared `packages/interactive-viewer/src/_tokens.scss` partial, `@import`ed at the top of BOTH aggregators
(`editor/src/style.scss` uses the relative `@import '../../interactive-viewer/src/_tokens.scss'` — dart-sass
resolves a relative import against the importing file's dir, no `--load-path` needed; it is a *source* partial so
per-package `sass src/style.scss` compiles it inline; the duplicate `:root,:host` block in the concatenated
`shadowCss` is byte-identical → harmless). Two layers: `--pfd-palette-*` primitives = **one per DISTINCT current
literal** (no over-consolidation — a single `--pfd-color-border` cannot equal `#cccccc`+`gray`+`lightgray` at
once) → semantic `--pfd-color-*`. Rewrite the ~50 color-bearing sites (~23 distinct literals) to `var(--pfd-*)`.
Reference sites MAY carry a literal fallback as cheap defense but this is NOT relied on for browser-support
degradation (a `var()` fallback fires only when the property is *undefined*, not when its value is
invalid-at-computed-value-time). Stay on `@import` (defer `@use` — blocked by nested `@import` in
`properties-panel/style/style.scss:11,20`).

### Fork 2 — Dark scheme: plain-hex base + `@media` + `[data-pfd-theme]`
No `light-dark()` (only "newly available" at the cutoff, and its IACVT failure has no safe literal fallback).
Base (light) tokens are **plain hex** on `:root, :host` (`color-scheme: light`) — always valid, so every engine
renders correct light chrome. `@media (prefers-color-scheme: dark) { :root, :host { …dark… } }` for auto dark.
Manual override `:root[data-pfd-theme="dark"], :host([data-pfd-theme="dark"]) { …dark… }` (+ a `"light"` block)
wins by **specificity** ((0,2,0) > the `@media`'s (0,1,0); base and `@media` are equal (0,1,0) so `@media` is
authored after base). Light values = exact current literals → light rendering byte-identical → the 10 VR
baselines DO NOT MOVE. `color-mix()` (widely available) supplies the mandated derivations in the DARK
declarations only.

### Fork 3 — Diagram body: CHROME-ONLY (canvas stays light in every theme)
Theming does NOT recolour the diagram body, node/alert icons, grid, or the canvas backdrop — a light document
inside a dark-chrome frame (the Figma/VS Code model). Rationale: diagram colours are document data; darkening the
canvas without darkening the unreachable default `#000` links would make them invisible. **Deferred (documented
ceiling)**: theme-aware diagram defaults need default-provenance in `pfdn-moddle` (moddle stamps the default hex
on read, indistinguishable from an explicit choice) and would reintroduce the export-neutrality problem — out of
scope for C13.

### Fork 4 — forced-colors
KEEP the `outline.ts:73` `.attr('stroke','red')` (lowest cascade, and the only thing keeping a selected outline
visible in a no-stylesheet/SSR export); layer `.element-outline { stroke: var(--pfd-color-selection, #ff0000) }`
OVER it (`outline.test.ts:40` unchanged). Under `@media (forced-colors: active)`: `.element-outline { stroke:
Highlight; forced-color-adjust: none }`. Focus rings only on genuinely-focusable chrome (dialog `<button>`s
`DomNotifications.ts:119,123`, search `<input>` `SearchPanel.ts:124`) mapped to system colors — palette/side-tab
divs are click-delegated and not focusable; keyboard-nav is C2 scope. Panels stay `forced-color-adjust: auto`.
`--pfd-color-selection` is **theme-invariant** (red in light AND dark — the outline is on the always-light
canvas, so a dark-lightened selection would be 2.34:1; not axe-catchable). `#ff4800` is likewise theme-invariant
(4.90:1 on `#1e1e1e`).

### Fork 5 — Export fidelity + Storybook/VR/a11y
**Export invariant: an exported SVG is byte-identical regardless of active theme.** Under chrome-only the
exported body has no tokens; the only themeable element that can appear (selection outline) stays neutral via the
retained `stroke='red'` attr. The element's wholesale-`shadowCss` `exportSVG` path stamps `data-pfd-theme="light"`
on the exported `<svg>` root — the pin block includes both `:root[data-pfd-theme="light"]` (matches the `<svg>`
document root in standalone `data:`-URI consumption, `exporting.ts:44-82`, winning by specificity) AND
`svg[data-pfd-theme="light"]` (matches the exported root under inline-HTML consumption where `:root`=`<html>`).
Storybook: `globalTypes.theme` + a decorator that stamps `data-pfd-theme` on `document.documentElement` (NOT the
story div — `:root`/`:host` wouldn't match a div), with the light/auto branch a strict no-op (no backgrounds
backdrop, no wrapper) to protect the 10 baselines; `gotoStory` gains a merged `emulateMedia({ reducedMotion,
colorScheme, forcedColors })`. VR: dark + forced-colors variants of the highest-chrome story (incl. the search
panel), new baselines auto-seeded. a11y: axe on the dark variant (text only — non-text 1.4.11 cases verified by
hand-computed ratio).

## The committed dark palette (WCAG-verified; light = exact current literal for pixel-stability)
surface `#1e1e1e` · surface-raised `#252526` · surface-hover `#2d2d2d` (light `#f0f0f0`) · border-strong `#3c3c3c`
(light `#cccccc`) · border-muted `#333333` (light `gray`) · border-subtle `#2a2a2a` (light `lightgray`) · text
`#e4e4e4` (13.1:1) · text-muted `#a0a0a0` (light `#808080`; 6.38:1) · text-secondary `#c0c0c0` (light `#555`;
8.6:1) · accent-ink `#6fb0e0` (7.11:1 on surface) · accent-fill `#5990bd` (kept mid so white-on-fill holds) ·
accent-fill-hover light `#4d80a8` literal / dark `color-mix(...black)` · selection `#ff0000` (invariant) ·
`#ff4800` (invariant) · list-item `#252526` (light `#eee`) · list-item-hover `#2d2d2d` (light `#f5f5f5`) ·
toast-link `#9ecbff` · toast severity hexes kept dark (white-on-severity pair; warning `#b26a00` is pre-existing
sub-AA, untouched). `gray` is dual-role: text sites → text-muted, border sites → border-muted; `#333` is text
except the `.search` input border → border-strong; `#fff` is surface-raised except white-text-on-accent (stays
literal) and the `_tabs.scss:61` seam-mask (→ surface-raised, same as pp-content bg).

## Correctness gates (test contract)
1. Export neutrality: `exportSVG` dark === light, both document + shadow paths, incl. a SELECTED element.
2. Model/XML untouched: import an explicit-`lineColor` fixture, toggle dark, `exportDiagram()` → `toXML`
   byte-identical to pre-theme.
3. Shadow-DOM token self-containment: mount `<d3-polytree-editor>` with NO host `:root` tokens → chrome themed.
4. Dark reachability via BOTH the media path (`emulateMedia colorScheme:dark`) and the attribute path
   (`data-pfd-theme="dark"`).
5. forced-colors selection visibility (`forcedColors:'active'` story); `outline.test.ts` unchanged.
6. Light pixel-stability: the 10 existing VR baselines unchanged.

## Rejected / deferred
`light-dark()` (rounds 1/3: newly-available + IACVT with no safe fallback → plain-hex + `@media` + attribute);
semantic over-consolidation (round 1: breaks pixel-stability); deleting the outline attr (round 1: SSR export
regression); themed diagram body / dark canvas (needs model default-provenance); `@use` migration (nested
`@import`); recolouring baked `<symbol>` sources; `.d3-tip` tooltip (unstyled, on `document.body` outside the
shadow token scope — documented out-of-scope); `exportSVG({ theme })` opt-in (future).

## Ledger lesson (append)
See `docs/design/ledger.md` — theming a canvas app splits colour into document-data (unreachable inline
literals, must not be themed) vs class-based chrome (themeable); tokens must be self-contained on `:root, :host`
(the custom element inlines its own CSS copy and reads nothing from the host page); a `var()` fallback does NOT
rescue an unsupported `light-dark()`/`color-mix()` (IACVT ≠ undefined); dual-role literals (`gray`/`#333`/accent/
`#5990bd`-as-fill-vs-border) each need a per-role token or a naive map yields invisible text; and non-text
UI-contrast (1.4.11) failures (selection on the light canvas) are invisible to the text-only axe gate — compute
them by hand.
