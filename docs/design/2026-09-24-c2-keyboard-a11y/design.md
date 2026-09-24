# Design: c2-keyboard-a11y

**Created**: 2026-09-24
**Depth**: full
**Rounds**: 3 (termination: approved — scope: `role="application"` included per user decision)
**Approved by**: user @ 2026-09-24
**Grounded in**: recon.md

---

## Chosen Approach

Ship keyboard-first accessibility as **two new `@d3-polytree/core` feature modules registered in `interactive-viewer` ahead of the drawers**, plus **two shared core changes** (per-element names in the draw layer; a shared graph helper) and **one surgical `zoom.ts` guard**. Per the user's gate decision, this includes `role="application"` and its Escape hatch — the full C2 named scope — with the honest caveat that assistive-technology *navigation correctness* is verified in CI only structurally (axe) and behaviourally (Playwright), and a manual real-AT pass (NVDA/JAWS/VoiceOver) is recommended post-merge.

**(1) `core` — per-element accessible names in the draw layer.** `BaseElement.appendElement` (`packages/core/src/draw/BaseElement.ts:104-119`) prepends `<title>` (from a pure `accessibleName(definition)` helper: element class + `type`/`text`/`name` when present on the def) and `<desc>` (element id) as the **first children** of every element `<g>`. Because it is in the draw layer, `Viewer.exportSVG()` (`viewer/src/index.ts:143`) and `@d3-polytree/ssr` output are accessible too, and the names survive reconcile by construction (no drawer selects `<g>` children positionally — Zones reads `select('rect')` and its only positional insert is on the drawing layer, `Zones.ts:66`; Nodes/Links/Labels insert by class selector).

**(2) `core` — shared `buildModelGraph`** in `packages/core/src/model/graph.ts` (new file; `model/` already holds `model.ts`/`status.ts`). Signature takes an optional `sizeOf` callback so `AutoLayout._buildGraph` (`autoLayout.ts:84-102`) delegates and stays **byte-identical** (nodes in input order, `width`/`height` via `_sizeOf`, edges from `definitions.link ?? []` filtered by `isLive` = `drawingRegistry.get(id) !== false` **and** both endpoints present in the node-id set). `keyboardNav` calls it (no `sizeOf`) for arrow-cone adjacency.

**(3) `core` — `prefers-reduced-motion` guard** in `zoom.ts` around `setInitialZoom`'s only animated path (`zoom.ts:108-118`; instant branch already exists at `:116`): when `matchMedia('(prefers-reduced-motion: reduce)').matches`, take the instant branch.

**(4) `interactive-viewer` — `keyboardNavModule`** (`static $inject = ['canvas','eventBus','d3polytree','selection']`): on `canvas.init` sets `role="application"` + a defaulted `aria-label` on the stable `<svg>` (`Canvas.ts:55-59`); maintains a **roving `tabindex`** (svg = entry `0`, element `<g>`s = `-1`, current roving target = `0`); implements **arrow-key direction-cone** navigation using `def.position` (no `getBBox`, jsdom-safe), driving selection through the injected `selection.select()` (`selection.ts:87-94`); appends a forced-colors-safe focus-ring `<rect>` (last child, re-asserted idempotently on `<class>.updated`, Outline precedent `outline.ts:63-96`); and a **real Escape hatch out of application mode** — Escape releases the roving element and moves focus to the container `<div>` *outside* the `role="application"` region, so AT returns to browse mode (and Tab from there follows normal document order). Registered in `interactionModules` **ahead of** `Viewer.modules` (`interactive-viewer/src/index.ts:36-48`) so it sees the initial `<class>.created` storm; `domNotificationsModule` stays last.

**(5) `interactive-viewer` — `ariaAnnouncerModule`** (`static $inject = ['canvas','eventBus']`): a container-level visually-hidden `aria-live="polite"` region (DomNotifications precedent `:26-29`) fed by `selection.changed` (`selection.ts:61`) and **post-boot** `<class>.created`/`.removed` (never `.updated`/`.moving`, which are per-move noise); boot-latched on `canvas.init` (fires after the drawers' storm, `Diagram.ts:65-66`). Messages: `"{name} selected"` / `"{n} selected"` / `"selection cleared"` / `"{name} added"` / `"{name} removed"`.

**Focus ring styling** — a new source partial `packages/interactive-viewer/src/_focus.scss`, `@import`ed into `style.scss` after `./outline`. It mirrors the **two-part** Outline rect mechanism: base `.element-focus-ring { fill: none; stroke-width: 0; }`, focus state `.element.pfd-focus > .element-focus-ring { stroke-width: 1px; stroke: var(--pfd-color-focus-ring, #1a73e8); }`, and `@media (forced-colors: active){ ... stroke: LinkText; forced-color-adjust: none; }` (distinct from selection's `Highlight`). `--pfd-color-focus-ring: #1a73e8` is defined in the **invariant** `pfd-tokens-invariant` mixin (`_tokens.scss:17`), since the ring is on the always-light canvas (like selection/outline). Built by the interactive-viewer sass step and propagated into `@d3-polytree/element`'s shadow CSS by its generator (`element/src/styles.generated.ts` auto-regenerates — PLAT-04 clean).

**Changesets (patch):** `@d3-polytree/core` (title/desc + graph helper + zoom guard + the two modules), `@d3-polytree/viewer` + `@d3-polytree/ssr` (title/desc change exported SVG bytes), and `@d3-polytree/interactive-viewer` + `@d3-polytree/element` (published CSS now carries the focus ring). Editor is **not** bumped (its `style.scss` imports only `tokens`, not `_focus`; consumers import both stylesheets).

**Verification.** axe (`a11y.spec.ts`) sees a valid `role="application"` + accessible name → stays green (`a11y-baseline.json` empty). A mandatory Playwright interaction spec (real Chromium, live `Editor` on `window`) asserts: **Case A** — focus svg, ArrowRight moves the roving target to a real `g[element-id]` and a *second* ArrowRight moves again (proves traversal, not first-focus) and fires selection (`.selected`); **Case B** — Escape moves `document.activeElement` *out of* the `role="application"` region, and Tab from there leaves the diagram. A new `graph.test.ts` locks `buildModelGraph`'s contract, explicitly asserting an edge to an id **absent from the node set** is dropped (the load-bearing `ids.has()` filter). Since axe cannot detect a keyboard trap, the interaction spec is the CI guard for exitability; real-AT forms-mode announcement quality is the residual manual pass.

## Rejected Alternatives

- **Defer `role="application"` (safe subset only)** — the Round-2/3 recommended default; **overridden by the user at the gate**, who chose to ship the full named scope now. Retained here as the alternative: it would have been fully CI-verifiable but left C2's "Escape hatch out of `role=application`" unmet.
- **`role="group"` instead of `role="application"`** — rejected under the user's decision: `group` does not put AT in forms mode, so arrow-key capture would not reach the diagram for screen-reader users.
- **`role="img"`** — rejected: collapses the subtree, hiding the roving-focusable element `<g>`s from the a11y tree.
- **Export layout's internal `assignRanks` for topo order** — rejected: it returns layer ranks, not a linear order, and consumes an abstract graph; widening a package that is a *dependency of core* violates `DN-7`. Re-derive from the model graph via the shared helper instead.
- **Announcer at the component layer via `Viewer.on()`** — rejected: rebound events exclude the lifecycle `<class>.created` storm the announcer/decorator need; an in-engine module gets them.
- **`<title>`/`<desc>` in the feature (not `BaseElement`)** — rejected: would leave SSR/export output inaccessible and require re-decoration on reconcile.
- **`role="application"` behind an opt-in flag** — rejected: ships an unverified support-bearing API surface; land it once, not dark behind a flag.

## Open Risks

- [ ] **AT-navigation correctness is not CI-provable.** axe + Playwright prove structure, exitability, and sighted-keyboard behaviour, but not that the arrow-cone/selection model reads correctly under NVDA/JAWS/VoiceOver forms mode. Mitigation: a post-merge manual real-AT pass; the ROADMAP note and changeset wording state AT-navigation is implemented-but-manually-unverified rather than claiming a certified AA audit.
- [ ] **`accessibleName` from `definition` alone** — an element referencing a separate label gets its `type`/class, not the label text, unless present on the def; acceptable, refinable later.
- [ ] **Arrow-cone ties** — overlapping `position`s make the "next" pick deterministic only up to a fixed tie-break; the deterministic story sample avoids ties.

## Principles & Host Rules Touched

- `DN-8` (SOLID) — honored by: two modules split along two DOM homes/reasons-to-change (keyboard+focus surface vs announce channel); names in the draw layer (shared), interaction in the feature.
- `DN-2` (reuse) — honored by: the shared `buildModelGraph` (no third copy of graph assembly), the Outline rect + forced-colors precedent, `selection.select`, the DomNotifications aria/region pattern, the existing `zoom.ts` instant branch.
- `DN-7` (YAGNI) — honored by: re-deriving topo order rather than widening layout's API; reduced-motion is a code path, not a module.
- Host rule "Boot order = event-subscription order … created-listener ahead of drawers" (root `CLAUDE.md`) — honored by: both modules registered in `interactionModules` ahead of `Viewer.modules`; `domNotificationsModule` stays last (last-def-wins).
- Host rule `PLAT-04` (no hand-editing generated files) — honored by: focus styling lives in source SCSS; `element/src/styles.generated.ts` auto-regenerates from built `dist/style.css`.
- Host rule "a11y axe gate stays green" (`visual-regression.yml`) — honored by: `role="application"` + `aria-label` is valid, named ARIA; interaction spec guards the trap axe cannot see.
- Ledger `2026-09-18` (didi `$inject`) — honored by: both services declare `static readonly $inject`.

## Waivers

- `DN-9` (Round-2/3 recommendation to defer `role="application"` until manual-AT verification) — **waived by the user at the gate**: user chose to ship `role="application"` now, accepting that AT-navigation correctness is not CI-verifiable and rests on a recommended post-merge manual-AT pass. Recorded per DN-3.
