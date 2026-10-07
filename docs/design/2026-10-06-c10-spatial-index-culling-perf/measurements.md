# C10 PR1 measurements

**Recorded**: 2026-10-07 · **Plan step**: 9 · **Environment**: Playwright 1.56.1 Chromium (headless) on the cloud dev container — **not** the pinned CI image and **not** a shared runner; all absolute numbers are indicative, ratios and orders of magnitude are what matter. Re-measured in `perf.yml` (pinned container) on every push; this file records the local numbers that drive the decisions below.

Sources: `apps/storybook/playwright/perf.spec.ts` (baseline + trigger measurements) and `culling-probes.spec.ts` (probes, overhang). Fixtures: `src/perf/fixture.data.ts` (seeded `mulberry32(1)`), `LARGE` = 10,000 nodes / 12,000 links / 1,000 labels / 40 zones = **23,040** drawn elements, 5% long-range links, all links `pinned`.

## 1. Baseline — culling off, interactive arm, 23,040 elements

| Metric                                              | Value                                                                                                                       |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Boot (`importDiagram`)                              | ~9.8 s                                                                                                                      |
| Pan frame delta p95 (median of 5 runs, scale 1)     | **116.7 ms** (min 116.7 / max 133.3) ≈ 8.6 fps                                                                              |
| `TaskDuration` per 60-move pan                      | ~7.6 s (main thread; raster/compositor excluded)                                                                            |
| Hit-test: viewport points landing on a link outline | **100%** (11,748/11,748) — long-range links' first→last-waypoint outline rects cover the canvas under `pointer-events: all` |

The fixture boots in the interactive arm (and, at 9,216 elements, in the Editor arm), which settles the plan's open question about booting ~23k elements.

## 2. Design §9 triggers

| Mechanism (design §9)             | Trigger                                                                        | Measured                                                                                                                                                                                        | Verdict                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chunked / budgeted hide**       | rAF callback p95 > 4 ms or any gesture frame > 33 ms on the worst case         | Hiding all 23,040 `<g>` in one tick = **1.2–2.7 s** main-thread (style recalc 0.8–2.3 s) for **every** mechanism tried; showing all = 1.7–2.9 s                                                 | **FIRED** — a one-frame hide of the ~22k elements the first flush / zoom-in-from-fit-all hides is ~50–80× over the 33 ms budget                     |
| SHOW as an index query / chunking | scan p95 over 23k slots > 2 ms                                                 | typed-array two-sided scan over 23,000 slots: p50 0.22–0.28 ms, p95 0.29–0.32 ms (two runs)                                                                                                     | not fired                                                                                                                                           |
| Free-list slot reuse              | scan time grows > 2× over the live-count baseline after 5k create/delete churn | tombstone-only: 50,000 slots allocated vs 5,000 live → scan ratio **1.87×** (run 1), **2.56×** (run 2); free-list: 10,000 slots → 1.44× / 1.62×. Absolute scan times 0.04–0.11 ms (noise-level) | **inconclusive / borderline** (fired in 1 of 2 runs) — re-measure with the real index in PR2                                                        |
| Dual-pad hysteresis               | any element toggles > 2× after a ±1 px boundary jitter (100 frames)            | single pad: **100 toggles in 100 frames** for every one of 200 straddling elements                                                                                                              | **FIRED by construction** — any single threshold toggles every frame when the boundary is straddled; see §4 (the trigger as worded cannot not-fire) |
| Editor arm in the perf lane       | Editor per-element overhead > 25% of the interactive arm                       | 9,216 elements: pan `TaskDuration` 2,185 ms (editor) vs 2,216 ms (interactive) = **−1.4%**; frame p95 33.3 vs 33.4 ms; boot 5.2 s vs 2.6 s                                                      | not fired                                                                                                                                           |

### Hide-mechanism variants (hide / show / hide-warm of all 23,040 `<g>`, `TaskDuration` ms, recalc in parentheses)

| Variant                                                                                                              | hide (cold)   | show          | hide (warm)   |
| -------------------------------------------------------------------------------------------------------------------- | ------------- | ------------- | ------------- |
| V1 attribute on `<g>` + descendant rule (the designed mechanism)                                                     | 2,468 (2,127) | 2,433 (1,397) | 1,821 (1,513) |
| V2 class on `<g>` + descendant rule                                                                                  | 1,858 (1,536) | 2,434 (1,385) | 1,793 (1,423) |
| V3 `display` attribute on each non-title/desc child                                                                  | 2,403 (1,859) | 2,562 (1,469) | 2,513 (1,908) |
| V4 inline `style.display` on each child                                                                              | 1,602 (1,234) | 1,699 (811)   | 1,227 (895)   |
| V6 shorter selector, attribute on `<g>`                                                                              | 1,535 (1,252) | 1,815 (847)   | 1,742 (1,388) |
| V5 `display:none` on the whole `<g>` (**reference only** — drops the AX node, violates the non-waived a11y decision) | 2,702 (2,298) | 2,898 (1,847) | 2,470 (2,060) |

No mechanism comes close to a 33 ms frame; per toggled element the cost is ~65–110 µs (almost all style recalc), so a ~30 ms frame budget is roughly **280–460 toggles per frame** and draining 22k hides takes ~50–80 frames (≈ 0.8–1.3 s). The mechanism choice (attribute vs class vs inline) moves the cost by at most ~1.5×; it does not remove the need for chunking.

## 3. `CULL_MIN_ELEMENTS` sweep — unculled pan cost vs drawn elements (interactive arm)

| nodes  | drawn  | boot ms | pan frame p95 (ms) | `TaskDuration` per pan (ms) |
| ------ | ------ | ------- | ------------------ | --------------------------- |
| 250    | 576    | 930     | 16.7               | 217                         |
| 500    | 1,152  | 921     | 16.8               | 287                         |
| 1,000  | 2,304  | 1,059   | 16.8               | 569                         |
| 2,000  | 4,608  | 1,590   | 16.8               | 1,036                       |
| 4,000  | 9,216  | 2,420   | 33.4               | 2,218                       |
| 10,000 | 23,040 | 9,775   | 116.7              | 7,641                       |

Unculled panning holds one 60 Hz frame (16.8 ms) up to ~4.6k drawn elements and first degrades at ~9.2k. The design's **provisional `CULL_MIN_ELEMENTS` = 1,000 would activate culling where the unculled viewer is already smooth**, paying culling's per-toggle recalc cost for no benefit. The data supports a threshold of **~5,000** drawn elements (the last smooth point is 4,608; the first degraded point is 9,216). This changes the correctness fixture: design §7 requires `SMALL ≥ 2 × CULL_MIN_ELEMENTS`, i.e. ≥ ~10,000 drawn elements (boots in ~2.4 s interactive / ~5 s Editor) instead of today's ~2.7k.

## 4. Findings that change or sharpen the design (for the gate)

1. **Chunked hides are required** (trigger fired). The default build's single-rAF hide pass cannot ship: activation/zoom-in would block the main thread for 1.5–2.5 s. The plan has no step for it (by design: "no step builds a promoted mechanism; return to the user").
2. **The dual-pad trigger is ill-posed.** A single threshold toggles every frame when the boundary is straddled; that is geometry, not a measurement. What matters is the cost: each toggle is one write on an element at least `pad` px off-screen (invisible), ~65–110 µs of recalc, so a pathological 1 px jitter on one boundary costs ≤ ~11 ms/100 frames per element. The trigger should be re-worded cost-based (e.g. "attribute writes per frame during a jitter gesture ≤ budget") or hysteresis adopted outright (two constants).
3. **`CULL_MIN_ELEMENTS` ≈ 5,000, not 1,000** (§3), which forces a larger correctness fixture.
4. **`locator.ariaSnapshot()` is not a faithful AX oracle** for this DOM (`- img` visible vs `""` hidden for the same `<g>`); the real CDP AX tree keeps the `<g>` as a named `group`. Total AX node count is **not** invariant — hiding two elements' painted children removed 3 decorative nodes (4,449 → 4,446) — the invariant is that every element's own `group` node (role + name) survives. The plan's G4 and Step 6 are amended accordingly.
5. **Link outline rects dominate hit-testing** (100% of sampled points). Culling hides them with the rest of the paint, which also removes this cost — a benefit the design did not count.
6. **Resize handles never render in the unmodified Editor** (0 `.resize-container` in the stock Interaction Harness too) — pre-existing, unrelated to C10; filed as a separate task. P4 (live-resize + wheel-zoom) therefore cannot be exercised through the UI.

## 5. Probe outcomes (small fixture, `culling-probes.spec.ts`; all assertions pass)

| Probe       | Outcome                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1          | With the production rule applied, the culled node and label `<g>` keep identical CDP AX `role`+`name` (`group` / `node (default)`, `label: N0`); `group` node count unchanged.      |
| P2          | `getBoundingClientRect` equals `getBBox` for a link path and is **unchanged after `stroke-width: 40`** — stroke is excluded; G1's oracle must add `stroke-width/2` + marker extent. |
| P3          | `focus()` on the culled `<g>` → `document.activeElement` is that `<g>` (`tabindex="-1"`).                                                                                           |
| P4          | Not observable: node selects on a real click but no resize handles exist (finding 6).                                                                                               |
| core import | `@d3-polytree/core` loads from a Playwright spec via `import()` and `require` (111 exports) — Step 23 imports `elementBounds` directly.                                             |

### Painted-extent overhang over raw model geometry (world units, 20 sampled per class; drawing transform identity)

| Class | whole `<g>` (outline + paint) left/top/right/bottom | paint target alone                                                                                | notes                                                     |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| node  | 0 / 0 / **6** / **6**                               | −3 / −3 / +3 / +3                                                                                 | outline = `size + 6`; paint inset by the `translate(3,3)` |
| link  | 0 / 0 / 6 / 6                                       | −3 / −3 / +3 / +3                                                                                 | stroke excluded (P2); `lineWidth` = 4                     |
| zone  | 0 / 0 / 0 / 0                                       | 0 / 0 / 0 / 0                                                                                     | no inner translate                                        |
| label | —                                                   | width ≤ **0.693** × fontSize × chars; height ≤ **1.25** × fontSize; origin offset ≤ +3.66 / +1.25 | the design's estimator (1.2 × / 1.5 ×) is conservative    |

**Pad** = `ceil(max overhang) + 1` = **7 world px** (provisional until G1 in Step 23 confirms it against real painted rects, per the plan).

## 6. Not yet measured

The separation safeguard (design §7: `off median p95 − on max p95 ≥ 2 × on-arm spread`) needs the culling-on arm, which does not exist until PR2; PR1 records only the off arm (baseline spread: p95 116.7–133.3 ms over 5 runs ≈ 14%). The blocking frame-time ceiling and `perf-budget.json` are therefore PR2 (plan Step 24).

## 7. Decisions taken on these numbers (2026-10-07, user-directed; design Amendment A1)

1. **Budgeted hide adopted** — `HIDE_BUDGET` = 300 toggles per frame (≈ 20–33 ms at the measured 65–110 µs per toggled element); stateless per-frame rescan, no cursor or epoch stamps.
2. **`CULL_MIN_ELEMENTS` = 5,000**, and the required-lane correctness fixture grows to ≥ 10,000 drawn elements (`SMALL` = 4,600 nodes / 5,520 links / 460 labels / 18 zones = 10,598).
3. **Dual-pad trigger reworded cost-based** (writes per frame under a ±1 px jitter ≤ `HIDE_BUDGET / 10`).
4. **Free-list reuse re-measured in PR2** against the real `FlatIndex` (≥ 5 runs, median).

Local, non-pinned-image numbers: `CULL_MIN_ELEMENTS` and `HIDE_BUDGET` are re-checked against the pinned-container `perf.yml` output in PR2.
