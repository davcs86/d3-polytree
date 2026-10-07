# Recon: c10-lod-zoom-out

**Created**: 2026-10-07
**Change**: Zoom-out level of detail (LOD) for nodes and links (and labels/zones as needed), extending C10 viewport culling, so a fit-all view of a ~10k-painted-element diagram stays interactive — keeping AT-discoverability, export parity, selection/keyboard behaviour and the existing gates.
**Depth**: deep
**Affected areas**: `packages/core/src/features` (culling, outline, selection, keyboardNav, drag, resize, zoom, tooltip) · `packages/core/src/draw` · `packages/interactive-viewer/src` (SCSS) · `packages/canvas/src` (export strip) · `apps/storybook/playwright` (gates, perf) · `docs/design/2026-10-06-c10-…`
**Predecessor artifacts**: `docs/design/2026-10-06-c10-spatial-index-culling-perf/{recon,design,plan,measurements}.md` — repo profile, host hard rules (PLAT-_/CORE-_), DI boot-order invariant and the CI/VR harness are carried from that recon unchanged (same repo, same day); this dossier only adds LOD-specific facts.

---

## Repo Profile

pnpm + Turborepo TS/ESM monorepo (`@d3-polytree/*`, D3 v7, didi DI). Gates: install→lint→typecheck→test→build→build-storybook (`.github/workflows/ci.yml`), pinned-container Playwright e2e (`visual-regression.yml`) and a pinned perf lane (`perf.yml`, blocking ON-arm ceiling `perf-budget.json`). Full profile: predecessor recon.

## Codebase Map

- **Culling feature** — `packages/core/src/features/culling.ts`
  - Value today is the single string `'culled'` (`:18`), per-slot state is a boolean `Uint8Array` `_culled` (`:56`) + `_culledCount`; the rAF `_frame()` two-sided scan (`:258-296`) hides `!inside` (budget 300/frame) and shows `inside`; sync SHOW lives in `_onZoomed` (`:237-251`) and is guarded by `_culledCount > 0`.
  - Inert below `CULL_MIN_ELEMENTS` = 5000 (`_mayRun`, `:171-179`) — LOD would be inert on small diagrams unless its gate differs.
  - Kind (`node|link|label|zone`) is known only inside the `_onCreated/_onUpdated` closures (`:105`); no per-slot kind array. Scale is read from persisted `settings.zoom.scale` in `_viewport()` (`:188-212`), which returns only Bounds.
  - `_checkCss` self-check (`:306-350`) samples the first culled slot's first non-title/desc child; label special-case reveal-before-measure in `_onUpdated` (`:134-136`).
- **CSS seam** — `packages/interactive-viewer/src/_culling.scss:7` `.element[data-pfd-transient] > :not(title):not(desc){display:none}` — matches ANY attribute value, so a new value (`'lod'`) needs no CSS change; export strip `SvgExportingUtils.ts:19` removes the attribute regardless of value.
- **Element DOM** (`draw/BaseElement.ts:121-139`): `<g class="{cls}Item element" element-id>` → `title`, `desc`, `g.innerElement` (translate 3,3) + class-specific content; Outline inserts `rect.element-outline` as `:first-child` (`outline.ts:65-66`), keyboardNav appends `rect.element-focus-ring` last (`keyboardNav.ts:99-103`), ResizeElement appends `g.resize-container` (nodes only).
  - Node: `.innerElement > svg > use[href=#type_icon_def]` (`Nodes.ts:219-227`) ≈ 8 DOM nodes.
  - Link: `.innerElement > path.line-path (marker-end, stroke-width lineWidth, round caps) + path.line-subpath (0.375×)` (`Links.ts:307-329`) ≈ 8 DOM nodes + a per-link `<marker>`+`<path>` in `<defs>` (`Markers.ts:23-46`; 10k links ⇒ 10k markers).
  - Label: `.innerElement > text` (`Labels.ts:405-413`) ≈ 7; Zone: `rect` directly on the `<g>` with `opacity` (`Zones.ts:466-473`) ≈ 7.
  - Draw `.updated` paths never write `class`/`data-*` on the `<g>` (`Nodes.ts:230`, `Links.ts:332`, `Labels.ts:416`, `Zones.ts:476`) so an externally set attribute survives; link stroke-width is written via inline `style` (`Links.ts:317,327`) — an LOD done by overriding stroke-width inline would be clobbered, a CSS rule keyed on a `<g>` attribute/class would not.
- **Interaction features vs hidden paint**
  - Selection = only `.selected` class on the `<g>` (`selection.ts:49,65`); its VISIBLE indicator is the outline rect (`_outline.scss:8-22`), a direct child ⇒ hidden by the culling rule. Hover indicator also (`:hover > .element-outline`).
  - Hit-testing: no `pointer-events` on any element child (only `pointer-events: all` on the root svg, `Canvas.ts:59`); a `<g>` whose children are `display:none` has NO hit area ⇒ click/drag/hover/mouseEvents/AddLinkTool node-pick cannot hit it; a click lands on the background and fires `background.click` (clears selection) (`zoom.ts:151-162`).
  - Drag binds `d3drag` on the `<g>` after `outline.created` (`drag.ts:219-226`), model-driven; Resize handles live in `g.resize-container` inside the `<g>` (hidden); keyboardNav roving focus is model-driven (`_center` from def), `_sizeRing` copies outline attrs (safe); focus lands on the `<g>` (tabindex preserved), ring is a child (hidden).
  - `getBBox` only for label/zone in Outline (`outline.ts:55-60`); culling already reveals labels before measure; **zones are not revealed** (possible existing gap: a culled zone updated while hidden measures 0×0).
  - Only scale-aware feature today: tooltip `TOOLTIP_ZOOM_THRESHOLD = 0.8` (`tooltip.ts:11,42`); axes re-tick on `zoom.end` (`axes.ts:102-119`). Zoom extent `[0.1, 15]` (`zoom.ts:14`).
  - `canvas.zoomed` fires per d3-zoom tick (per frame during wheel/drag/tween; `zoom.end` once per gesture); culling coalesces to ≤1 rAF per burst (test `culling.test.ts` "at most once per dirty burst").
- **Gates that LOD touches** (`apps/storybook/playwright/culling.spec.ts`): G1 `STATES` include scale 0.12 and 0.5 (`:247-254`) and `wronglyCulled` flags ANY `data-pfd-transient` value on an in-view oracle element — LOD-hidden in-view elements would fail it unless value-aware; G2 lower bound `painted ≥ strict` breaks under LOD (upper bound holds); G3 whitelists only the attribute with ≤2 toggles/element and ≤`HIDE_BUDGET` hides/frame; G4 (AX role+name) holds (title/desc/`<g>` survive); G5 byte-parity (strip is value-agnostic); G6 `display:none` computed check; `perf.spec.ts` has no zoom-out/fit-all arm; `perf-budget.json` holds one pan budget (40 ms).
- Tests: `culling.test.ts`, `culling.realconstants.test.ts`, `editor/src/culling.property.test.ts`, `zoom/outline/keyboardNav/drag/resize*.test.ts`, `SvgExportingUtils.test.ts`, `ssr/renderToSvg.test.ts:39`.

## Patterns to REUSE

- One transient attribute on the `<g>` + one CSS rule (A′ mechanism) → reuse `data-pfd-transient` with a new value; `culling.ts` two-sided stateless pass, sync SHOW, hide budget and idle attribute.
- Tooltip scale threshold precedent → `tooltip.ts:11,42`.
- Reveal-before-measure for `getBBox` consumers → `culling.ts:134-136`.
- Playwright harness, `setView`/`settled()`, oracle, `perf.spec.ts` ON arm + `perf-budget.json` → extend, do not fork.
- Fixture scaling → harness `nodes` arg / `fixture.data.ts`.

## Host Conventions & Hard Rules

Carried from the predecessor recon (verbatim quotes with `path:line` there): "Last definition of a token wins", boot order = event-subscription order, never hand-edit `*.generated.ts`, VR only in the pinned container, no `v2` links, README+changeset on public API changes, repo CLAUDE.md "How to Act" (ask on ambiguity; minimum; surgical; verify). Design constraints already decided by the user for C10 and still binding here: AT-discoverability is NOT waived (every element keeps `<g>`+title/desc/tabindex); reroute/boot/SearchPanel/Selection O(N²) are out of scope; the frame-time assertion is blocking.

## Dependencies

- Data/schema: none (LOD state is DOM-only, transient, never in the model / `status`).
- External contracts: exported SVG must not carry the attribute (already stripped); public options: `ViewerOptions.culling` exists — an LOD option/threshold would be a new public surface (README + changeset).
- Config/environment: none.
- Cross-area edges: culling ⇄ CSS ⇄ outline/selection/focus visuals ⇄ pointer hit-testing ⇄ Playwright oracle.

## Measured evidence (new, this session — local dev container, interactive arm, 23,040-element `LARGE` fixture, harness 1000×700, scale 0.1 offset (-50,-30), 3 scripted pans each; ad-hoc spec, not committed)

| Arm                 | pan frame p95 (ms) | hidden / painted of 23,040 |
| ------------------- | ------------------ | -------------------------- |
| culling OFF         | 383, 400, 367      | 0 / 23,040                 |
| culling ON (no LOD) | 283, 267, 267      | 12,780 / 10,260            |

At fit-all, culling already removes the off-screen half but ~10.3k elements (mostly nodes ≈ 4.4k and links ≈ 5.2k; labels ≈ 460) stay painted and the pan is still ≈ 270 ms/frame (≈ 16 fps). A label-only LOD (the plan's Step 26) would remove ≈ 4% of what is painted. Pinned-container ON-arm at scale 1 is 16.8 ms (`measurements.md` §8) — the problem is specific to low scale. Not measured: which of nodes/links dominates the painted cost at scale 0.1; per-class LOD gains.

## Spike results (round 1, throwaway spec, local dev container, not committed)

Same setup as above (23,040 `LARGE`, interactive arm, culling ON, scale 0.1, culling idle, 3 scripted pans per mode). LOD simulated by injecting CSS keyed on a container attribute; "flip" = set/remove the attribute then force style+layout (`getBoundingClientRect`), `flipTask` = CDP `TaskDuration` delta over the flip.

| Mode (what is hidden at low scale)                                                                                         | pan frame p95 (ms)                  | flip wall / task (ms) |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------- |
| none (culling only)                                                                                                        | 283, 300, 283 (later 317, 300, 317) | —                     |
| **A** all painted children of every node + link (`<g>`, title, desc stay; `.selected` exempt)                              | **83, 83, 67**                      | 2,590 / 3,116         |
| **B** nodes: hide `.innerElement`, outline rect becomes a filled placeholder; links: drop subpath + marker, keep main path | 217, 233, 233                       | 1,264 / 1,524         |
| **N** only nodes fully hidden                                                                                              | 217, 217, 217                       | 1,317 / 1,767         |
| **L** only links fully hidden                                                                                              | 167, 167, 167                       | 1,355 / 1,805         |
| remove attribute (back to none)                                                                                            | 317, 300, 317                       | 1,235 / 1,687         |

Reading: (1) links dominate paint cost, nodes second, and only hiding BOTH removes most of it (≈ 4×); keeping any placeholder geometry (B) recovers only ≈ 20%. (2) The floor with nothing painted is still ≈ 70–80 ms: the ~10k `<g>` boxes themselves (style/layout/transform invalidation) dominate — going lower needs hiding whole layers (drops AX nodes, non-waived) or an aggregate/canvas overlay (waived/deferred). (3) A container-level flip is NOT O(1): one 1.2–3.1 s long task in either direction (descendant style recalc over ~23k elements), i.e. the same order as 10k per-element writes.

## Risks / Not-found

- **No LOD code, no `MIN_LEGIBLE_PX`, no kind-per-slot, no scale predicate** in culling; state is boolean ⇒ needs richer per-slot state (visible / culled / lod) and a precedence rule.
- **Selected/focused/hovered elements** lose their only visual indicator (outline/ring are hidden children) and become un-hit-testable under any `display:none` LOD — selection/hover/drag/resize/link-tool/background-click semantics at low zoom are an open design question.
- **SHOW is unbounded** (design §9): zooming IN across the LOD threshold must reveal all in-view LOD slots synchronously (≈48–110 µs each) — at ~10k painted that is ≈ 0.5–1 s on a single frame; HIDE is budgeted (300/frame) so zoom-OUT leaves painted elements for ~O(N/300) frames.
- **`_checkCss` / inspect() / idle / inert gate** all assume a boolean culled state and ≥5000 elements.
- **Zones' `getBBox` gap** in `Outline` (culled zone updated while hidden) — pre-existing; LOD of zones would widen it.
- **Not found**: LOD-specific measurements (per-class paint cost at low scale); whether `mouseEvents.ts`/`selection.ts` use `closest('.element')`; icon-pack internals (`packages/icons-*`) for filters/masks; any `tooltip.test.ts`/`selection.test.ts`; empirical `canvas.zoomed` counts per gesture; behaviour of the zoom-to-element tween in a non-zoomable viewer (per-tick events are dropped when `_isZoomable` is false, `zoom.ts:143`).
- **Ledger traps** (`docs/design/ledger.md`): syntactic tripwires cannot prove totality (use behavioural sequence tests); direct property reads not `.get()` on isMany; PLAT-06 determinism (never iterate a Map for output).

## Recommended Scope

Advisory, input to the debate: (a) which classes get LOD and what "reduced" means (hide all paint vs keep a cheap placeholder such as the node icon `<rect>` or a single link path); (b) trigger (scale threshold vs painted-count-in-view vs both) and gating vs `CULL_MIN_ELEMENTS`; (c) selected/focused/hover handling; (d) hit-testing and background-click semantics while LOD is active; (e) SHOW/HIDE cost control across the threshold; (f) gate changes (G1 oracle value-awareness, G2 bound, new LOD gate, fit-all perf arm and budget).
