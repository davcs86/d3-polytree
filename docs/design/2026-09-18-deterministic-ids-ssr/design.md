# Design: deterministic-ids-ssr

**Created**: 2026-09-18
**Depth**: full
**Rounds**: 3 (termination: approved)
**Approved by**: user @ 2026-09-18
**Grounded in**: recon.md

---

## Chosen Approach

C9 has two parts: make id generation deterministic/injectable, and add a new `@d3-polytree/ssr`
package that renders a `.pfdn` document to a static SVG string in Node without a real browser.
Pressure-tested over three full-depth rounds; the two architectural risks (the `globalThis`-swap
timing and the DI-override reach) were verified SOUND against code, and two DN-1 defects the debate
surfaced were fixed and re-verified.

### Part 1 — Deterministic IDs (`@d3-polytree/canvas`)

The single non-deterministic id source is `ElementRegistry._ids = new Ids([8,24,86])`
(recon.md `ElementRegistry.ts:12`) — the `ids` lib mints random hex per instance. Make it injectable:

- **`IdGenerator` interface** — the exact subset `ElementRegistry` calls on its `ids` instance:
  `nextPrefixed(prefix, element?): string`, `claim(id, element?): void`, `unclaim(id): void`
  (`ElementRegistry.ts:16,23,24,31`). Method names mirror `ids`, so the call sites are unchanged.
- **`IdsIdGenerator`** wraps `new Ids([8,24,86])` — the **default, random, behavior-preserving** impl.
- **`SequentialIdGenerator`** — deterministic, **collision-safe**: a claimed-id `Set`; `claim(id)`
  records; `nextPrefixed(prefix)` increments a per-prefix counter and loops while the candidate is in
  the Set (skipping already-claimed ids) before returning; `unclaim` removes. Mirrors the guarantee
  `ids` itself gives via `assigned` tracking.
- **`ElementRegistry`** gains `static readonly $inject = ['idGenerator']` and
  `constructor(private readonly _ids: IdGenerator = new IdsIdGenerator())`. The `$inject` is
  **load-bearing**: without it, didi's `parseAnnotations` regex parses the default-arg constructor and
  throws `No provider` at boot (verified against `didi/dist/index.js:76,197,126`; it fires on
  `Diagram.test.ts:15` `get('elementRegistry')`). The default arg keeps every direct
  `new ElementRegistry()` construction green with zero edits (`drawerTestUtils.ts:22`,
  `ElementRegistry.test.ts:6,14,22`, `ElementBuilder.test.ts:7`). Matches the sibling pattern
  `Canvas.$inject`/`ElementBuilder.$inject`.
- **`canvasModule`** registers `idGenerator: ['type', IdsIdGenerator]` (`module.ts:10-16`) — the
  default token. Consumers get today's random behavior unchanged.
- **Override** via the documented last-def-wins seam: a later module `{ idGenerator: ['value', gen] }`
  in `options.modules` overrides the default (module order `canvasModule → options.modules`,
  `Diagram.ts:47-53`, `viewer/src/index.ts:129-134`). Verified: the singleton `ElementRegistry`
  resolves `idGenerator` after all providers are registered, so the override reaches it.

`ElementBuilder` routes through the same `ElementRegistry.claimId` (`ElementBuilder.ts:19`), so
injecting the generator once covers every id-minting path.

### Part 2 — `@d3-polytree/ssr`

A new package mirroring the `packages/canvas` scaffold (package.json exports-triple/scripts, tsup
esm+cjs+dts, tsconfig extending base — recon "New-package template"). Deps: `@d3-polytree/viewer`
and `@d3-polytree/core` at `workspace:*`, and **`jsdom` as a direct dependency** (it is the only Node
DOM that satisfies `getSvgString`, and `renderToSvg` news up a `JSDOM` internally, so it must be a
runtime dep; already a root devDep). Vitest env `jsdom`.

```ts
export async function renderToSvg(
  xml: string,
  options?: { idGenerator?: IdGenerator }
): Promise<string>
```

Implementation, inside a **serial mutex** (a module-level promise chain — `globalThis` is shared, so
concurrent calls must queue):

1. `const gen = options?.idGenerator ?? new SequentialIdGenerator()`.
2. **`installDom()`** — create a `JSDOM`, then for each `Object.getOwnPropertyNames(window)` copy the
   descriptor onto `globalThis` **only if the key is not already present** (`!(key in globalThis)`),
   recording the added keys. This installs the full DOM surface (`document`, `DOMParser`,
   `XMLSerializer`, `Node`, `SVGElement`, …) without clobbering JS intrinsics (`Object`, `Array`),
   which would break cross-realm `instanceof`. The base render path only truly needs `document`,
   `DOMParser` (`IconLoader.ts:79`, eager on every render via `iconLoaderModule` ← `nodesModule`), and
   `XMLSerializer` (`SvgExportingUtils.ts:13`) — none of which exists on Node's `globalThis`, so
   add-only installs all three. **`uninstallDom()`** (in `finally`) deletes exactly the added keys.
3. **Pre-claim** — `const host = await loadModel(xml)` (parse #1), then for each
   `definitions.get('node'|'link'|'label'|'zone')` collection, `gen.claim(el.id)` for every string
   `.id`. This reserves author-set ids **before** boot, because during boot `claimId` interleaves
   generation with author ids (`BaseElement.ts:102,142-147`) and a naive counter could otherwise mint
   a `node_2` that later collides with an author-set `node_2`. Those four are the only collections a
   drawer stamps (only `Node/Link/Label/Zone` extend `BaseElement` and call `claimId`), so pre-claiming
   them is provably total.
4. `const viewer = new Viewer({ container: document.body, modules: [{ idGenerator: ['value', gen] }] })`;
   `await viewer.importDiagram(xml)` (parse #2 — boot); `return viewer.exportSVG()`. `_boot` is private
   and `importDiagram` always re-parses, so the double-parse is the cleanest seam; ids are read verbatim
   from the same XML, so both parses yield identical author-id sets. SSR is not a hot path, so the
   second parse is acceptable.
5. Restore globals in `finally`.

**Determinism** holds run-to-run: with the deterministic generator injected, `ids`' randomness is
never invoked; id-less elements get `<className>_<n>` in a stable order (module order
`labels,zones,links,nodes` × document order within each collection); icon `<symbol>` ids are
key-derived (`IconLoader.ts:86,93`); `document.styleSheets` is empty (no viewer CSS — nodes/links use
inline SVG attributes) so nothing is inlined; XMLSerializer attribute order is deterministic for an
identically-built DOM.

**Accepted degeneracies** (host rules, not bugs): jsdom `getBBox`→zero box (already guarded,
`outline.ts:58-59`) and `transform.baseVal`→identity (`Canvas.getTransform`, intentional shim). SSR
output is deterministic but geometrically flat — correct for golden files and thumbnails. SVG only;
the PNG path is browser-canvas-only and out of scope. `renderToSvg` is **serial-only**.

**Changesets**: `@d3-polytree/canvas` minor (additive `IdGenerator`/`IdsIdGenerator`/
`SequentialIdGenerator` exports + `idGenerator` token; back-compatible default); `@d3-polytree/ssr` new
package at `0.1.0`.

## Rejected Alternatives

- **Default-arg constructor with no `$inject`** (round-1 seam) — rejected: didi parses the constructor
  and throws `No provider` at boot. Fixed by declaring `$inject = ['idGenerator']` + a token.
- **`options.window` / DOM-agnostic "inject a Document"** — rejected: the draw layer reads the *global*
  `document`/`XMLSerializer`, so a passed `Document` can't be threaded; it degenerates to `globalThis`
  mutation anyway, and only a jsdom-fidelity DOM satisfies the pipeline. Committed to self-contained
  jsdom instead.
- **`options.css` / CSS provisioning** — rejected: there is no viewer-level stylesheet; nodes/links use
  inline SVG attributes + `<use href>`, so a bare `exportSVG()` is standalone. Dropped (YAGNI).
- **`options.size`** — rejected: `Canvas.getSize` is `clientWidth/Height` (0 under jsdom) and the svg is
  `width/height=100%`, so `size` is inert. Dropped (YAGNI).
- **Hand-enumerated global list** — rejected: it dropped `DOMParser` (needed on every render). Replaced
  by the add-only full-surface copy.
- **Naive `node_${++n}` sequential generator** — rejected: collides with author-set ids on mixed-id
  docs. Replaced by the Set-backed collision-safe generator + the pre-claim pass.
- **linkedom / happy-dom** — rejected: they expose empty `cssRules` / partial DOM; jsdom is the proven
  Node DOM (already a devDep) and satisfies the whole pipeline.
- **jsdom as an optional peer dep** — rejected: `renderToSvg` constructs a `JSDOM` internally, so jsdom
  must be a direct runtime dependency.

## Open Risks

- [ ] **Add-only guard skips a coincidentally-present Node global.** If a future Node exposes a
  base-path DOM global (`document`/`DOMParser`/`XMLSerializer`) as a non-DOM value, add-only would skip
  jsdom's version. Verified moot today (none is a Node global). — revisit if a needed global becomes a
  Node built-in; the fallback is a small force-override essential set. Note in the ssr code.
- [ ] **Serial-only.** Concurrent `renderToSvg` calls are serialized by the module mutex; genuine
  parallelism would need a worker/realm per render. — documented, adequate for golden tests/thumbnails.
- [ ] **Double-parse cost.** Two `moddle.fromXML` per render. — acceptable (SSR is not a hot path);
  revisit only if a pre-boot host seam is added to `Viewer`.

## Principles & Host Rules Touched

- `DN-2` (reuse) — honored: the whole render pipeline (`Viewer.importDiagram`/`exportSVG`), the
  last-def-wins DI seam, `loadModel`, `getSvgString`, and the canvas package scaffold are all reused;
  the draw layer is not re-implemented.
- `DN-7` (YAGNI) — honored: dropped `css`/`size`/`window` options and the force-override set; minimal
  `renderToSvg(xml, { idGenerator? })`.
- `DN-8` (SOLID) — honored: `IdGenerator` is a single-responsibility seam injected at its own
  granularity; `ElementRegistry` depends on the abstraction.
- `DN-9` (staff-engineer) — honored: chose determinism + self-contained jsdom + serial mutex over
  speculative flexibility; verified the didi behavior in code (the ledger lesson) rather than assuming.
- Host rule "jsdom shims are intentional … don't fix them" (`CLAUDE.md:93-96`) — honored: SSR accepts
  the zero-box/identity degeneracies; no shim touched.
- Host rule "transform.baseVal identity fallback … Keep it." (`packages/canvas/CLAUDE.md:11-13`) —
  honored: untouched.
- Host rule "CI … install → lint → typecheck → test → build → build-storybook" (`CLAUDE.md:34`) —
  honored: the new package joins turbo via the workspace glob + `build`/`typecheck`/`test` scripts; no
  CI edit; Changesets recorded.
- Host rule "D3 slices are peer deps" (`packages/core/CLAUDE.md`) — honored: ssr depends on
  viewer/core/canvas (workspace) + jsdom; d3 comes transitively as peers.
- Host rule "Cross-package tests read built `dist`" (`CLAUDE.md:97-99`) — honored: rebuild canvas
  before core/viewer/ssr when running dependent tests directly.

## Waivers

None. All norm objections raised across the three rounds were addressed in the design; none was waived.
