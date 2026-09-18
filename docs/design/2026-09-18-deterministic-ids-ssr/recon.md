# Recon: deterministic-ids-ssr

**Created**: 2026-09-18
**Change**: C9 — make id generation deterministic/injectable (reproducible rendered output), and add a new `@d3-polytree/ssr` package that renders a `.pfdn` document to a static SVG string in Node without a real browser. (ROADMAP.md §11 C9.)
**Depth**: full
**Affected areas**: `packages/canvas/src/` (id source + SVG export), `packages/core/src/draw/` (id-claim call sites), a new `packages/ssr/`, plus the `Viewer` render/export entry.

---

## Repo Profile

pnpm 10 + Turborepo monorepo of `@d3-polytree/*` ESM/TS packages, layered `canvas + pfdn-moddle → core → viewer → interactive-viewer → editor`. Rendering is DOM-based; tests run under **jsdom** with deliberate shims. Every package builds with `tsup` (ESM+CJS+dts), typechecks with `tsc --noEmit`, tests with `vitest run`. A new `packages/ssr/` is auto-included by the `packages/*` workspace glob and joins the turbo pipeline by defining `build`/`typecheck`/`test` scripts (no CI edit).

## Codebase Map

- **`packages/canvas/src/`** (TS)
  - **The single non-deterministic id source**: `ElementRegistry._ids = new Ids([8, 24, 86])` (`ElementRegistry.ts:12`) — the `ids` lib mints random hex per instance; not seedable/injectable today.
  - Id API used by callers: `claimId(element, prefix)` sets `element.id = element.id || this._ids.nextPrefixed(\`${prefix}_\`, element)` then `this._ids.claim(...)` (`ElementRegistry.ts:22-26`); also `claim(id, element)` (`:16`), `unClaim` (`:29`), `removeElementById` (`:40`). Pre-set ids are preserved (the `|| ` guard).
  - SVG-to-string: `getSvgString(svgNode)` uses `new XMLSerializer()`, `svgNode.setAttribute`, `document.createElement('style')`, and reads **`document.styleSheets`** to inline matching CSS (`SvgExportingUtils.ts:9,13,53,79`). Entry: `Canvas.getSVGStr()` → `getSvgString(this._svg.node())` (`Canvas.ts:81-82`).
  - DOM construction: `Canvas` uses `document`/`document.createElement` (`Canvas.ts:11-12`), `select(container).append('svg').append('g')` (`:48-53`), `document.createElementNS(SVG_NS,'g')` (`:105`); the `transform.baseVal` identity fallback in `Canvas.getTransform` is an intentional jsdom shim (`packages/canvas/CLAUDE.md:11-13`).
- **`packages/core/src/draw/`** (TS)
  - Id-claim call site: `BaseElement` calls `this._elementRegistry.claimId(definition, this._className)` during reconcile/boot (`draw/BaseElement.ts:102`); `_className` (node/link/label/zone) is the prefix. This is where a `moddle.create`'d element with no id gets stamped.
  - `moddle.create` does **not** auto-assign ids (`modelling/Nodes.ts:51` etc.) — so moddle is already deterministic; non-determinism enters only at `ElementRegistry`.
  - Icon id namespacing: `IconLoader.namespaceIds(root, key)` → `<key>_<id>` (`draw/IconLoader.ts:18,93`) — deterministic (key-derived), relevant to reproducible SVG.
- **`Viewer`** (`packages/viewer/src/index.ts`)
  - `exportSVG()` → `this.get<Canvas>('canvas').getSVGStr()` (`:93-95`); `importDiagram(xml)` → `loadModel` → `_boot`; `exportDiagram()` → `moddle.toXML` (`:85-90`). This is the render/export entry an SSR host would drive.
- **`packages/ssr/`** — does not exist (net-new).

## Patterns to REUSE

- **New-package template** → mirror `packages/canvas/package.json` (name/version/type/main/module/types/`exports` triple/`files`/`sideEffects:false`/`scripts` `build:tsup`,`typecheck:tsc --noEmit`,`test:vitest run`/`publishConfig.access:public`, `canvas/package.json:2-46`), `packages/canvas/tsup.config.ts` (entry/format esm+cjs/dts/clean/sourcemap/external), `packages/canvas/tsconfig.json` (extends base, outDir/rootDir/include). Workspace dep pattern `"@d3-polytree/<pkg>": "workspace:*"` (`viewer/package.json:28-30`).
- **The whole render pipeline** → an SSR host reuses `Viewer.importDiagram`/`exportSVG` verbatim; SSR is a thin host, not a re-implementation of rendering.
- **Deterministic-id precedent** → `links.test.ts:25` `definition.id = \`link_${++this._seq}\`` — the sequential shape a deterministic generator should take.
- **The DI seam** → `ElementRegistry` is a `['type', ElementRegistry]` service in `canvasModule`; the "last definition wins" seam lets a consumer override a token (root CLAUDE.md:68-70).

## Host Conventions & Hard Rules

- **Hard rule**: "jsdom shims are intentional. … don't 'fix' them as if they were bugs." — `CLAUDE.md:93-96`. (An SSR renderer hits `getBBox`→zero-box and `transform`→identity; it must accept them, not fix them.)
- **Hard rule**: "The jsdom `transform.baseVal` identity fallback lives in `Canvas.getTransform` — intentional, not a bug. Keep it." — `packages/canvas/CLAUDE.md:11-13`.
- **Hard rule**: "D3 slices are peer deps — import from the specific `d3-*` package, never a `d3` bundle." — `packages/core/CLAUDE.md`.
- **Hard rule**: "CI … runs exactly: install → lint → typecheck → test → build → build-storybook. Mirror that before pushing." — `CLAUDE.md:34-35`.
- **Hard rule**: "Cross-package tests read built `dist`, not source … rebuild the changed upstream package first." — `CLAUDE.md:97-99`.
- **Hard rule**: pnpm 10 pinned; don't downgrade/upgrade — `CLAUDE.md:35-36`.
- Convention: publishable package needs a Changesets entry and (for release) a Trusted Publisher — `CLAUDE.md:114-118`, `.changeset/`.
- Convention: `Node.size` default 25, `Node.type` default `"default"`, `Node.label` is an IDREF — moddle defaults apply on read (`packages/pfdn-moddle/CLAUDE.md`) — relevant to reproducing rendered output.

## Dependencies

- Data / schema: none new (renders existing `.pfdn`).
- External contracts: `ElementRegistry`'s public methods (`claimId`/`claim`/`unClaim`) — changing its constructor to accept an injected generator is the main API touch; new `@d3-polytree/ssr` public API (`renderToSvg(xml)` or similar); a new `IdGenerator` interface exported from canvas.
- Config / environment: SSR needs a DOM in Node — jsdom is already a root devDep (`jsdom@^25`); whether SSR takes jsdom as a dependency, a peer, or an injected `Document` is a design fork. CSS for standalone SVG (`getSvgString` reads `document.styleSheets`) must be provisioned.
- Cross-area edges: `BaseElement.claimId` → `ElementRegistry` → id generator; SSR host → `Viewer` → `Canvas` → DOM.

## Risks / Not-found

- **No injectable-id seam today** — `new Ids([8,24,86])` is inline at `ElementRegistry.ts:12`; Part 1 must introduce one (interface + default + deterministic impl) without changing default (random) behavior for existing consumers.
- **"No browser" ≠ "no DOM."** The entire draw layer is DOM-based (`document`, `d3-selection`, `createElementNS`) and `getSvgString` needs `document.styleSheets`/`XMLSerializer`. A pure-Node string renderer would be a full re-implementation of the draw layer — out of scope. Realistic SSR = a **Node DOM host** (jsdom / linkedom / caller-injected `Document`). **This is the central design fork.**
- **jsdom geometry is degenerate** — `getBBox`→zero box, `transform`→identity. SSR output is reproducible (deterministic) but geometrically flat (outlines/text-sizing that depend on measured layout render at zero/identity). Acceptable for golden-file tests + thumbnails; must be stated.
- **CSS provisioning** — `getSvgString` inlines CSS from `document.styleSheets`; an SSR host must load the components' compiled `dist/style.css` into the document (or inject CSS text) or the exported SVG is unstyled.
- **PNG export path is browser-only** — `exporting.ts` uses `document.createElement('canvas')` + `canvas.toDataURL` (`:66-78`); SSR should stay SVG-only (out of scope for PNG).
- **jsdom as a runtime dependency is heavy** — a published `@d3-polytree/ssr` that hard-depends on jsdom drags a large tree onto consumers; an injectable-`Document` design avoids it.

## Recommended Scope

Advisory (input to the debate + plan; not binding):
- **Part 1 (determinism):** introduce an `IdGenerator` interface in canvas (the subset `ElementRegistry` uses: `nextPrefixed`, `claim`, `unclaim`), a default impl wrapping `ids` (preserves current random behavior), and a deterministic sequential impl. Inject it into `ElementRegistry` (constructor/optional), overridable via the DI token or a canvas option, so SSR/tests get reproducible ids.
- **Part 2 (SSR):** a new `packages/ssr/` exposing `renderToSvg(xml, options?): Promise<string>` (or sync) that hosts a `Viewer` against a Node DOM, wires the deterministic id generator, provisions CSS, and returns `exportSVG()`. Resolve the DOM fork (jsdom dep vs injectable `Document` vs linkedom) in the debate. Ship as a golden-file test substrate (unblocks C8) — SVG only, PNG out of scope.
- Vitest env for the SSR package (`node` vs `jsdom`) depends on the DOM fork; a Changeset entry for the new package.
