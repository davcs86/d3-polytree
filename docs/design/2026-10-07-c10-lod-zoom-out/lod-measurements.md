# C10 LOD (zoom-out) — step-0 spike measurements

Source: `apps/storybook/playwright/lod-spikes.spec.ts` in the pinned `perf.yml` container
(`mcr.microsoft.com/playwright:v1.56.1-noble`). **n = 3 pinned runs** (not the plan's ≥ 5; see Deviation):
[run 33](https://github.com/davcs86/d3-polytree/actions/runs/37713923103) and
[run 34](https://github.com/davcs86/d3-polytree/actions/runs/37713926776) on `14f75ca`, and
[run 35](https://github.com/davcs86/d3-polytree/actions/runs/37862461949) on `main` (`9924ed2`). Run 34
S0-1…S0-3 lines were not read; S0-1…S0-3 are deterministic trace facts also observed locally and in run 33.
LOD is **CSS-simulated** (container attribute `data-lod-sim`), so these numbers are decision inputs, not budgets.

## Tables

| Spike                                                 | Result (pinned, n=3 unless noted)                                                                                                                                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S0-1 events                                           | `setInitialZoom`: start/zoomed/end = 1/1/1. Programmatic `setZoom`: 0/1/0 (**`canvas.zoomed` only**). `zoom.to.element` with zoomable=false: 1/0/1. Bare click: start+end, no `zoomed`. (n=1 pinned, run 33; matches local)                               |
| S0-2 handoff                                          | 1 px drag-release never reaches a container-capture `click`; dblclick zooms unless `stopPropagation` is called (→ mark-and-skip is viable, stopPropagation would break dblclick-zoom). (run 33)                                                           |
| S0-3 discriminator                                    | Real click: `PointerEvent`, `pointerType:"mouse"`, `detail≥1`, trusted. dblclick: plain `MouseEvent`, `detail 2`. `.click()`/keyboard: `detail 0`, non-pointer. (run 33, Chromium only)                                                                   |
| S0-4 E (in-view painted node+link groups, 1000×700)   | 9,828 @0.10 · 4,070 @0.16 · 2,755 @0.20 · 1,742 @0.25 (identical in 3 runs). At 3000×1800: 20.9k / 21.3k / 18.2k / 11.8k                                                                                                                                  |
| S0-4 enter drain @0.16, 1000×700 (300/frame)          | 14 frames, total 551–612 ms, median frame 38–46 ms, max 56–62 ms                                                                                                                                                                                          |
| S0-4 sync-exit task @0.16 / @0.20, 1000×700           | 248–251 ms / 172–178 ms (3000×1800 @0.16: 1.1–1.2 s)                                                                                                                                                                                                      |
| S0-5 settled pan p95, fit-all, simulated hide vs none | none 150 ms (133–167); hide 33–50 ms at 0.16/0.20/0.25. Separation ≥ 83 ms vs frame-quantised spread ≤ 16.7 ms (safeguard `off median − on max ≥ 2× on spread` holds at ≥ 5× margin)                                                                      |
| S0-5 thrash (0.17↔0.21, 20 gestures)                  | repeating 0.9–1.3 s task per OFF crossing. **Confounded**: the simulation flips one container attribute (≈1 s style-recalc for 23k), which is not the real per-element exit (≈0.25 s @0.16 per S0-4). Not evidence that the real hysteresis band thrashes |
| S0-6 resolver ambiguity (4 px, AABB upper bound)      | none 44 / single 3 / **multi 453** of 500, at 0.10 and 0.16 → click resolution must pick by distance/area, not assume a unique hit                                                                                                                        |
| S0-7 `content-visibility:hidden` on SVG `<g>`         | Applies (computed `hidden`); zoom-tick p95 ≈ 117–150 ms vs 270–530 ms none / 316–350 ms hide; **AX name becomes `""`** (vs `"node (default)"`) → violates AT-discoverability; rejected for Stage 1                                                        |

## Decisions

- (a) Constants: **keep provisional** (`LOD_SCALE_ON` 0.16, `LOD_SCALE_OFF` 0.20, `LOD_EXEMPT_CAP` 200, `LOD_CLICK_TOL_PX` 4). E at 0.16 is ~4.1k at 1000×700 but ~21k at 3000×1800, so enter drain and exit cost scale with the viewport; Step 10 must measure the real mechanism at both.
- (b) ON is evaluated in the budgeted `_frame` outside gestures (design). OFF must be synchronous in `_onZoomed`. Programmatic `setZoom` fires **only** `canvas.zoomed` (no start/end), so the `_onZoomed` OFF path cannot rely on `zoom.start/end`; `zoom.to.element` with zoomable=false fires start/end and no `zoomed`, so the ON evaluation must also run after `zoom.end`.
- (c) Resolver handoff: mark-and-skip confirmed viable; `stopPropagation` is not (breaks dblclick-zoom).
- (d) Pointer discriminator: `detail > 0` on the click (`dblclick` is plain `MouseEvent` — use `detail>=2` + the preceding pointer click). Verified Chromium only.
- (e) The sync exit is a 250 ms task at 1000×700 (0.16) and 1.1 s at 3000×1800: this is the accepted "one-time jank" from the user decision, but large viewports exceed any reasonable budget → surface in Step 10.
- (f) Ambiguity is the norm at 4 px (≈90%): the resolver must rank candidates (nearest/topmost), per the plan's pick order.
- (g) S0-7: content-visibility rejected for Stage 1 (AT). Stage 2 may revisit with an explicit `aria-label` fallback.

## Go / No-go: **GO (conditional)**

The No-go criteria were: simulated fit-all pan not beating culling-only by the 2× spread safeguard (**passes**, ≥ 83 ms vs ≤ 16.7 ms spread), S0-2/S0-3 contradicting the resolver design (**no contradiction**), and a thrashing 0.16–0.20 band. The thrash result is confounded by the container-attribute simulation and is carried into the Step 10 real-mechanism gate instead of being treated as a pass. The pan win is ~3–4× at the simulated hide-all and does **not** reach the 33 ms goal on the pinned image (33–50 ms), as previously stated to the user.

## Deviation

Plan Step 2 asks for ≥ 5 pinned runs; n = 3 exist and the session cannot dispatch workflows. User chose (2026-10-09) to record at n = 3 and flag it. The separation margin (≥ 5× the safeguard) makes additional runs unlikely to change the verdict; the thrash/exit questions are re-measured on the real mechanism at Step 10 (≥ 5 pinned runs there).

---

## Step 10 — the real mechanism, pinned

Source: `perf.spec.ts` › `C10 perf (zoom-out LOD)` in the pinned `perf.yml` container; **n = 4 completed runs so far**
([41](https://github.com/davcs86/d3-polytree/actions/runs/38073121507),
[42](https://github.com/davcs86/d3-polytree/actions/runs/38073124013),
[45](https://github.com/davcs86/d3-polytree/actions/runs/38074570796),
[46](https://github.com/davcs86/d3-polytree/actions/runs/38074574463)); runs 43/44 were cancelled by the next push. Fixture: 23,040 elements,
interactive arm, scale 0.1, 5 pans per arm per run. The baseline is the **same build** with the `@internal` `lod:false` switch.

| Run | LOD p95 median (min–max) | no-LOD p95 median (min–max) | Separation | Ratio | Enter long task / worst frame | Sync exit long task / worst frame |
| --- | ------------------------ | --------------------------- | ---------- | ----- | ----------------------------- | --------------------------------- |
| 41  | 16.8 (16.8–33.3)         | 150.0 (133.4–150.0)         | 116.7 ms   | 8.9×  | 433 / 683 ms                  | 105 / 150 ms                      |
| 42  | 16.8 (16.7–16.8)         | 150.0 (150.0–150.0)         | 133.2 ms   | 8.9×  | 401 / 617 ms                  | 96 / 167 ms                       |
| 45  | 16.8 (16.7–16.8)         | 149.9 (133.4–150.0)         | 133.1 ms   | 8.9×  | 436 / 700 ms                  | 108 / 167 ms                      |
| 46  | 16.8 (16.7–16.8)         | 133.4 (133.4–149.9)         | 116.6 ms   | 7.9×  | 430 / 683 ms                  | 113 / 183 ms                      |

Culling-only (LOD not applicable at scale 1) is unchanged at 16.8 ms in the same runs; the 40 ms ceiling still holds.

### What this says

- **The mechanism beats the simulation.** The CSS-simulated hide in Step 2 gave 33–50 ms; the real per-slot mechanism gives **16.7–16.8 ms (one frame) in 19 of 20 pans and 33.3 ms in one**. The separation safeguard (`no-LOD median − LOD max ≥ 2 × LOD spread`) holds by 3.5× in the worst run (run 41: 116.7 ms vs a 33.0 ms threshold; the other runs have a spread of 0.1 ms).
- **The 33 ms goal is met** on the pinned image for the settled fit-all pan (the fork stated in design "Stated plainly" resolves in favour of "accept LOD", no Stage 2 needed for this metric). Zoom ticks (not a pan) are not part of this gate and are not improved.
- **Enter is a ≈ 0.4 s long task, not a smooth drain.** The `setInitialZoom` call that crosses 0.16 spends ≈ 400–440 ms synchronously (the `canvas.zoomed` handler plus the style recalculation for the zoom itself); the budgeted hide drain that follows then runs at ≤ 300 writes per frame. Worst frame during the whole enter ≈ 620–700 ms. This is the same order as the one-time jank the user accepted for exit, but enter was meant to be the smooth direction; it is not, and is recorded as a known limitation rather than hidden.
- **Sync exit** measured here jumps from 0.1 to scale 1, where only the elements of the new viewport (hundreds) are revealed: ≈ 100 ms long task / ≈ 150–185 ms worst frame. An exit that lands just above 0.2 reveals the ≈ 2.8k in-view eligible elements (the CSS-simulated reveal in S0-4 took ≈ 175 ms at 1000×700) and larger viewports scale with the in-view count (≈ 1.1 s at 3000×1800). This arm only measures the first case.
- The Step 2 thrash concern (container-attribute flip ≈ 1 s) does not apply to the real mechanism: exit is per-element and bounded by the in-view count.

### Go / No-go for merging the LOD arm: **GO**

The safeguard passes in every run, the pinned fit-all LOD p95 is ≥ 2× better than no-LOD in every run (7.9–8.9×), and no correctness gate regressed. Budgets (`fitAllPan`, `lodCrossing` in `perf-budget.json`) stay **record-only until ≥ 5 pinned runs exist**; with n = 4 the plan's rule is not yet satisfied and this section is updated when it is.
