# d3-polytree — Modernization Roadmap

> **Status:** Proposal / RFC · **Owner:** @davcs86 · **Last updated:** 2026-09-14
> **Strategy:** Hybrid, phased-to-rewrite · **Language target:** TypeScript · **D3:** slim, modular peer dependency

This document is the single source of truth for modernizing `d3-polytree`. It captures a
full audit of the current code, defines the target architecture, and sequences the work into
milestones with explicit exit criteria so the effort is executable and reviewable rather than
open-ended. It is intentionally opinionated to minimize rework: decisions are recorded inline,
and open questions are flagged for resolution before the phase that depends on them.

---

## 1. Executive summary

`d3-polytree` is a browser library that renders interactive [polytree](https://en.wikipedia.org/wiki/Polytree)
diagrams (directed, layered node/link graphs with grouping, tooltips, drag, zoom, floating
labels, and per-node data tables) on top of D3. The current implementation is functional but
is built on a **fully end-of-life stack**: D3 v3, Grunt + Browserify, JSHint, Bootstrap 3, and
a browser-bundled Node XML parser (`xml2js`) that **requires manual patching of `node_modules`
on every install**. There are **zero tests**, **no CI**, **no type definitions**, and a **latent
case-sensitivity bug** that breaks the build on Linux.

The chosen direction is **hybrid, phased-to-rewrite**:

- **Track A — Stabilize (`v1.x` maintenance):** make the *existing* codebase correct, buildable,
  and reproducible without changing its public API. This unblocks current consumers and buys
  time for Track B.
- **Track B — Rewrite (`v2.0`):** a greenfield, TypeScript, ESM-first package with modern
  modular D3 (v7) as a slim peer dependency, aligned with the `v2.0-beta` component split
  (viewer / interactive-viewer / modeler). A documented migration bridge connects v1 → v2.

The two tracks run in parallel after Track A ships, with a strict rule: **no new features land
on v1** — v1 receives correctness and security fixes only; all feature investment goes to v2.

---

## 2. Current-state audit

### 2.1 Repository inventory

| Path | Role | Notes |
|---|---|---|
| `index.js` | Package entry | `module.exports = require('./lib/SimpleNetwork')` |
| `lib/SimpleNetwork.js` | Core class (~839 LOC) | Layout, rendering, interaction — the entire engine |
| `lib/utils/helper.js` | Link-path geometry (~350 LOC) | Bezier routing, side-connector math |
| `lib/utils/dblClick.js` | Double-click gesture | Uses removed D3 v3 `d3.dispatch`/`d3.rebind`/`d3.mouse` |
| `lib/utils/lightbox.js` | Modal overlay | `innerHTML` injection via `min-dom` |
| `lib/utils/styles.scss` | Styles | Depends on Bootstrap 3 table classes |
| `lib/icons/{index.js,default.svg}` | Icon registry | Parsed at runtime by `xml2js` |
| `tasks/bundle.js`, `GruntFile.js` | Build | Grunt + Browserify + uglify-js 2 |
| `dist/*` | Committed build output | 30k-line bundle checked into VCS |
| `bower.json`, `.jshintrc` | Legacy config | Bower + JSHint (both EOL) |

### 2.2 Findings (ranked by severity)

Severity: **S1** = broken/insecure/blocks build · **S2** = major maintainability/architecture ·
**S3** = hygiene/DX.

| # | Sev | Finding | Evidence | Impact |
|---|-----|---------|----------|--------|
| F1 | **S1** | **Case-sensitivity bug.** Import path casing does not match the file on disk. | `lib/SimpleNetwork.js:14` `require('./utils/lightBox')` vs file `lib/utils/lightbox.js` | Resolves on macOS/Windows (case-insensitive FS) but **throws `MODULE_NOT_FOUND` on Linux** — i.e. CI, Docker, most cloud builds. |
| F2 | **S1** | **Non-reproducible build.** README instructs hand-editing `node_modules/xml2js/lib/xml2js.js` (lines 11 & 19) after every `npm install`. | `README.md` "Known issue" | Build cannot run unattended; onboarding and CI are impossible without a manual patch step. |
| F3 | **S1** | **Node XML parser shipped to the browser.** `xml2js` (+ `events`, `timers-browserify`, `Buffer` shims) is bundled solely to parse 8 lines of *static* SVG at runtime. | `SimpleNetwork.js:45,484-498`; `icons/index.js` | Bloats bundle, drags in Node polyfills, and is the root cause of F2. Icons are known at build time — no runtime XML parsing is warranted. |
| F4 | **S1** | **End-of-life core dependency: D3 v3.5.16.** Render path uses APIs *removed* in D3 v4+. | `d3.behavior.zoom/drag`, `d3.layout.force`, `d3.transform`, `d3.event.translate/scale`, `zoom.event()`, `d3.rebind`, `d3.mouse`, `.attr({})`/`.style({})` object form | Cannot coexist with any modern D3 consumer; blocks every downstream security patch in the D3 line. |
| F5 | **S2** | **Module-global mutable state.** `processedIcons` (and `rawIcons`) are module-scoped and shared across all instances; `defineIcons()` mutates the shared map. | `SimpleNetwork.js:46-47,494,704-711` | Multiple `SimpleNetwork` instances on one page corrupt each other's icon view-box registry. |
| F6 | **S2** | **XSS surface.** Unsanitized data is injected as HTML. | `SimpleNetwork.js:736-754` (`.html()` string-built `attachedData` table); `lib/utils/lightbox.js` (`domify`/`innerHTML` of `content`) | Any untrusted `label`/`attachedData`/lightbox content executes in the host page. |
| F7 | **S2** | **Dead toolchain.** Grunt 0.4.5, Browserify 13, uglify-js 2, JSHint, `sassify`, `svg-browserify`, `load-grunt-tasks`, `time-grunt`. | `package.json` devDeps, `GruntFile.js`, `tasks/bundle.js` | No ESM output, no tree-shaking, no modern sourcemaps; `new Buffer()` (deprecated) in `tasks/bundle.js:32`. |
| F8 | **S2** | **No tests, no CI.** `"test": "echo 0"`; `.jshintrc` declares Jasmine globals but no specs exist. | `package.json:7`, `.jshintrc` | Every change is unverified; the geometry engine (`helper.js`) is pure and highly testable but untested. |
| F9 | **S2** | **Identity incoherence.** Package name `d3-simple-networks` (v1.0.0), bower name `d3-polytree`, repo `d3-polytree`, dist `d3-simple-networks.js`, global `D3SimpleNetwork`. | `package.json:2`, `bower.json:2`, `README.md` | Not installable by a single canonical name; confuses discovery and npm publishing. |
| F10 | **S2** | **Force layout misuse.** A `d3.layout.force` simulation is created, then `force.stop()` is called on the first tick; nodes are `fixed:true`. | `SimpleNetwork.js:599,610-613,761-791` | Pays the cost/complexity of a physics simulation for what is a deterministic layered layout. Simplifiable. |
| F11 | **S3** | **Heavy deps for trivial use.** Full `bootstrap-sass` 3 (EOL) for table CSS; `base-64` + `utf8` for base64 that `btoa`/`TextEncoder` now do natively; `d3-tip` 0.6; `lodash` 4 (replaceable by native ES + optional micro-deps). | `package.json` deps; `SimpleNetwork.js:167-174` | Large footprint; native platform APIs exist for all of these. |
| F12 | **S3** | **Committed build artifacts.** `dist/` (incl. a 30k-line bundle) is tracked in git. | `dist/*` | Noisy diffs, merge conflicts, drift between source and dist. |
| F13 | **S3** | **Legacy-browser cruft in the hot path.** IE10/IE11 `marker-end` "A"-toggle hack runs on every tick. | `SimpleNetwork.js:574-581` | Dead complexity; IE is fully deprecated. |
| F14 | **S3** | **No a11y.** SVG has no `role`/`aria-*`/`<title>`/`<desc>`; interactions are mouse-only. | `SimpleNetwork.js` render code | Not screen-reader or keyboard accessible. |
| F15 | **S3** | **Distribution gaps.** No `package-lock.json`, no `exports` map, no `types`, no `sideEffects`, no `.editorconfig`/Prettier, `bower.json` still primary, D3 pinned as a hard dep rather than peer. | root config | Poor consumer DX and non-deterministic installs. |

### 2.3 What is worth preserving

- **`helper.js` link-routing geometry** is genuinely valuable domain logic (side-connector
  quadrant assignment, arrow spacing, dual-bezier routing). It is D3-independent and should be
  **ported near-verbatim** into v2 with a test harness wrapped around it first.
- **The layered `calculateLevels`/`calculateNodes` algorithm** (topological leveling of the
  polytree) is the conceptual core and should be preserved as a pure module.
- **The public options shape** (`nodes` adjacency map, `groups`, `floatingLabels`, `attachedData`,
  `tableHeaders`, `onNodeClick`) defines the v1 contract the migration bridge must honor.

---

## 3. Guiding principles

1. **Correctness before modernity.** Ship the case-fix and reproducible build (Track A) before
   any rewrite work begins — a green baseline is a prerequisite for safe refactoring.
2. **Pure core, thin shell.** Layout and geometry are pure, framework-free, and unit-tested;
   D3/DOM is a rendering adapter at the edge. This is the fault-isolation boundary that keeps
   the engine testable and the D3 upgrade contained.
3. **D3 as a slim peer dependency.** Depend only on the submodules actually used
   (`d3-selection`, `d3-zoom`, `d3-drag`, `d3-force`/`d3-scale` as needed, `d3-array`) and
   declare them as **peer** dependencies so consumers control the D3 version and dedupe.
4. **Types are the contract.** Author in strict TypeScript; ship `.d.ts`. The options object
   becomes a typed, validated public API.
5. **No unattended manual steps.** Everything (install → build → test → publish) runs in CI
   from a clean checkout with a committed lockfile.
6. **Security by default.** No `innerHTML`/`.html()` with unsanitized input; render text as text.
7. **Backward-compatibility is explicit, not accidental.** v2 either honors the v1 options via a
   compat adapter or documents the break in a migration guide — never silent.

---

## 4. Target architecture (v2)

```
packages/                         # (optional) monorepo; see §7 open question O3
  core/                           # framework-free, pure TS — no D3, no DOM
    layout/
      levels.ts                   # topological leveling  (ex-calculateLevels)
      positions.ts                # deterministic coordinates (ex-calculateNodes)
    routing/
      linkPath.ts                 # bezier routing         (ex-helper.calculateLinkPath)
      sides.ts                    # quadrant/side math     (ex-helper side logic)
    model/
      graph.ts                    # normalized graph model + validation
      options.ts                  # typed options + defaults + schema validation
    index.ts
  render-svg/                     # D3/DOM adapter — the only place D3 is imported
    renderer.ts                   # selection lifecycle (enter/update/exit)
    interactions/
      zoom.ts                     # d3-zoom
      drag.ts                     # d3-drag
      dblclick.ts                 # native pointer-events (retire d3.dispatch/rebind)
    icons.ts                      # build-time icon registry (no runtime XML parsing)
    tooltip.ts                    # replace d3-tip (self-owned, ~30 LOC)
    lightbox.ts                   # safe DOM construction (no innerHTML)
    styles.css                    # plain CSS custom properties (drop Bootstrap)
    index.ts
  viewer/                         # static viewer (no zoom)      ── v2.0-beta component 1
  interactive-viewer/             # viewer + zoom + search panel ── v2.0-beta component 2
  modeler/                        # authoring/editing UI          ── v2.0-beta component 3
```

**Key architectural changes vs v1**

- **Icons resolved at build time.** SVG icons imported as strings/`<symbol>` fragments via the
  bundler; the registry is a plain typed map. Eliminates `xml2js`, `events`, `timers-browserify`,
  `Buffer`, and the manual patch (kills F2, F3).
- **Deterministic layout replaces the force simulation.** The layered coordinates are already
  computed analytically; drop `d3.layout.force` and keep an optional `d3-force` collision pass
  only if overlap resolution is desired (addresses F10).
- **Instance-scoped state.** All registries (`processedIcons`, marker defs) live on the instance,
  not the module (kills F5).
- **Text is text.** Node labels, tables, and tooltips use `textContent`/DOM nodes; `attachedData`
  tables are built with `document.createElement`, not string concatenation (kills F6).
- **Own the micro-widgets.** Replace `d3-tip` and `min-dom` with ~60 LOC of typed, dependency-free
  helpers (kills part of F11 and the deep `min-dom/lib/*` imports).

---

## 5. Roadmap — phases & milestones

Effort estimates are order-of-magnitude for one experienced maintainer and are **relative**, not
calendar commitments.

### Track A — Stabilize v1.x (blocking; do first)

> Goal: a correct, reproducible, CI-verified `v1.1.0` that current consumers can rely on, with
> **no public API change**.

| Phase | Deliverable | Exit criteria | Effort |
|---|---|---|---|
| **A0 — Baseline** | Green checkout | `npm ci` works from scratch on Linux; document exact current behavior with a smoke demo | S |
| **A1 — Critical fixes** | `v1.1.0` | **F1** import casing fixed; **F2/F3** `xml2js` runtime parsing removed (icons pre-parsed at build or shipped as `<symbol>` strings) so no `node_modules` patch is needed; build runs unattended | M |
| **A2 — Security patch** | `v1.1.1` | **F6** `.html()`/lightbox injection replaced with safe DOM/text; add basic input escaping | S |
| **A3 — Build reproducibility** | committed `package-lock.json`; `dist/` removed from VCS and produced by CI | Clean-room build reproduces byte-stable-ish bundle; **F12** resolved | S |
| **A4 — CI + smoke tests** | GitHub Actions | Lint + build + a minimal render smoke test (jsdom or Playwright) run on every PR; **F8** partially addressed | M |
| **A5 — Identity** | canonical name decision | Resolve **F9**: single package name across `package.json`/dist/global/README; deprecate `bower.json`; publish to npm under the canonical name | S |

**Track A explicitly does NOT:** upgrade D3, convert to TS, or change the options API. Those are
Track B. Keeping A surgical is what makes it safe to ship quickly.

### Track B — Greenfield v2.0 (parallel after A ships)

> Goal: TypeScript, ESM-first, modular-D3 rewrite aligned with the `v2.0-beta` component split,
> with a documented v1→v2 migration path.

| Phase | Deliverable | Exit criteria | Effort |
|---|---|---|---|
| **B0 — Scaffolding** | New toolchain | Vite/tsup (lib mode) or Rollup; TypeScript strict; ESLint + Prettier; Vitest; ESM+CJS+`.d.ts` outputs with an `exports` map, `types`, and `sideEffects` (**F7, F15**) | M |
| **B1 — Pure core** | `core/` package | Port `calculateLevels`, `calculateNodes`, and `helper.js` geometry to typed pure functions **behind a full unit-test suite written first** (characterization tests captured from v1) | L |
| **B2 — Options & model** | Typed public API | `options.ts` with defaults + runtime validation; normalized graph model; documented types | M |
| **B3 — SVG renderer** | `render-svg/` | Migrate rendering to D3 v7 modular APIs (`d3-selection`/`zoom`/`drag`); instance-scoped state (**F5**); native dblclick (**retire F13 IE hacks**); own tooltip/lightbox (**F6, F11**); build-time icons (**F3**) | L |
| **B4 — Components** | viewer / interactive-viewer / modeler | Each component built on `core` + `render-svg`; feature-parity checklist vs v1 for the viewer; search panel for interactive-viewer; editing for modeler | XL |
| **B5 — A11y & theming** | Accessible, themeable | SVG `role`/`<title>`/`<desc>`, keyboard nav, focus states; CSS custom properties replace Bootstrap (**F14, F11**) | M |
| **B6 — Migration bridge** | `v1→v2` guide + compat adapter | An adapter that accepts the v1 options object and drives v2, or a documented codemod/migration guide; example app upgraded | M |
| **B7 — Release** | `v2.0.0` | Published to npm with provenance; docs site/README; live examples replacing the JSFiddle demo; semver policy stated | M |

### Dependency graph (what blocks what)

```
A0 → A1 → A2 → A4 → A5   (A3 parallel to A2/A4)
A1 (build reproducible) ─────────────┐
                                     ▼
B0 → B1 → B2 → B3 → B4 → B5 → B6 → B7
             (B1 tests gate all downstream refactors)
```

---

## 6. Cross-cutting workstreams

### 6.1 Testing strategy
- **Unit (Vitest):** `core/` geometry and layout are pure → aim for high coverage here first; the
  `helper.js` routing math is the highest-value target (many branches, zero current coverage).
- **Characterization tests:** before porting, snapshot v1 outputs (layout coordinates, generated
  path `d` strings) for a set of fixture graphs; assert v2 reproduces them within tolerance.
- **Component/DOM (Vitest + jsdom, or Playwright component tests):** renderer enter/update/exit,
  drag/zoom interactions, tooltip show/hide.
- **Visual regression (Playwright screenshots):** guards the geometry against subtle regressions.

### 6.2 Tooling & CI
- **Build:** `tsup` or Vite library mode → ESM + CJS + `.d.ts`, external/peer D3.
- **Lint/format:** ESLint (typescript-eslint) + Prettier; delete `.jshintrc`.
- **CI (GitHub Actions):** `install → typecheck → lint → test → build` on PR; **release** workflow
  (Changesets) for versioning, changelog, and npm publish with provenance on tag.
- **Repo hygiene:** `.editorconfig`, `.nvmrc`/`engines`, committed lockfile, `dist/` gitignored.

### 6.3 Distribution & versioning
- **Canonical name:** decide `d3-polytree` (recommended — matches repo/domain) and align every
  artifact. Deprecate the `d3-simple-networks` name on npm with a pointer.
- **Package fields:** `"type": "module"`, `exports` map (import/require/types), `"sideEffects"`
  (CSS files listed), `"peerDependencies"` for the D3 submodules, `"files"` allowlist.
- **Semver:** v1.x = fixes only; v2.0 = breaking; document a support window for v1.
- **Retire Bower.**

### 6.4 Documentation
- README rewrite (install, quick start, typed options reference, examples).
- Migration guide v1→v2.
- Replace the single JSFiddle with in-repo runnable examples (and optionally a docs site).

---

## 7. Open questions (resolve before the dependent phase)

| ID | Question | Blocks | Recommendation |
|---|---|---|---|
| O1 | Canonical package name — `d3-polytree` vs keep `d3-simple-networks`? | A5 | `d3-polytree` |
| O2 | Is byte-for-byte layout parity a hard requirement, or is "visually equivalent within tolerance" acceptable for v2? | B1, B3 | Tolerance-based parity via characterization tests |
| O3 | Monorepo (viewer/interactive-viewer/modeler as separate packages) vs single package with subpath exports? | B0, B4 | Single package + subpath exports first; split later only if consumers need it |
| O4 | Minimum browser support matrix for v2 (drop IE entirely, confirm evergreen-only)? | B3 (retire F13) | Evergreen + last 2 versions; drop IE |
| O5 | Keep a bundled-D3 build variant for `<script>`-tag / no-bundler users alongside the ESM peer-dep build? | B0, B7 | Ship an optional UMD/IIFE bundle with D3 included as a secondary artifact |
| O6 | Does the `modeler` component need persistence/serialization (save/load diagrams), and in what format? | B4 | Define a versioned JSON schema derived from the v1 options shape |

---

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| D3 v3→v7 rewrite introduces subtle interaction regressions | High | High | Characterization + visual-regression tests gate B3; migrate interaction-by-interaction |
| Geometry port (`helper.js`) drifts from v1 behavior | Medium | High | Write tests against v1 output **before** porting (B1 gates downstream) |
| Scope creep in `modeler` (B4) stalls the whole v2 | High | Medium | Ship `viewer` first as `v2.0.0`; modeler can follow as `v2.1` |
| Consumers depend on the current global `D3SimpleNetwork`/options shape | Medium | Medium | Compat adapter + migration guide (B6); keep v1.x supported during transition |
| Peer-dep D3 causes version-mismatch friction for some users | Medium | Low | Provide the bundled UMD variant (O5); document supported D3 range |
| "Track A only" temptation — rewrite never starts | Medium | Medium | Enforce "no new features on v1"; all feature demand routes to v2 backlog |

---

## 9. Immediate next actions (first PRs)

1. **Fix F1** (import casing) — one-line change; unblocks Linux/CI. *(A1)*
2. **Remove runtime `xml2js`** — pre-parse icons at build time or ship as `<symbol>` strings;
   delete the README manual-patch step. *(A1/F2/F3)*
3. **Add GitHub Actions** — `install → build` on Linux to prevent F1-class regressions. *(A4)*
4. **Commit `package-lock.json`; gitignore `dist/`.** *(A3/F12)*
5. **Resolve O1** (canonical name) and align `package.json`/README. *(A5/F9)*

Each is small, independently reviewable, and moves the repo to a green baseline before Track B
scaffolding (B0) begins.

---

## Appendix A — File-by-file disposition

| File | Track A action | Track B disposition |
|---|---|---|
| `index.js` | keep | replaced by `src/index.ts` + `exports` map |
| `lib/SimpleNetwork.js` | fix F1/F5/F6 in place | decomposed into `core/` + `render-svg/` |
| `lib/utils/helper.js` | keep (add tests if cheap) | ported to `core/routing/*` (typed, tested) |
| `lib/utils/dblClick.js` | keep | replaced by native pointer-event dblclick |
| `lib/utils/lightbox.js` | fix F6 (safe DOM) | reimplemented in `render-svg/lightbox.ts` |
| `lib/utils/styles.scss` | keep | plain CSS + custom properties, drop Bootstrap |
| `lib/icons/*` | pre-parse at build | build-time icon registry |
| `tasks/*`, `GruntFile.js` | keep minimal | deleted (replaced by tsup/Vite) |
| `bower.json` | keep for now | deleted |
| `.jshintrc` | keep for now | deleted (ESLint) |
| `dist/*` | remove from VCS | produced by CI only |
