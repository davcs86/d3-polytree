# Implementation Plan: deterministic-ids-ssr

**Status**: `pending`
**Created**: 2026-09-18
**Design**: [design.md](./design.md)
**Test harness**: `pnpm --filter @d3-polytree/<pkg> exec vitest run <file>` (`CLAUDE.md:30-31`); full `pnpm test` (`package.json:19`); lint `pnpm lint` (`package.json:21`), typecheck `pnpm typecheck` (`package.json:20`). No coverage threshold declared.
**Total Steps**: 4
**Review**: `passed-with-warnings @ 2026-09-18`

---

## Execution Summary

Part 1 (Steps 1) makes id generation injectable in `@d3-polytree/canvas` without changing the default
random behavior. Part 2 (Steps 2–3) scaffolds the new `@d3-polytree/ssr` package and implements
`renderToSvg`. Step 4 records Changesets and runs the full CI mirror. The tree stays green at every
step: Step 1 is additive+back-compatible; Steps 2–3 add a new leaf package that nothing else depends
on.

## Step Dependencies

- Step 2 requires Step 1 (ssr overrides the `idGenerator` token / uses `SequentialIdGenerator` exported by canvas).
- Step 3 requires Step 2 (implements into the scaffold) and Step 1 (the generator + seam).
- Step 4 requires Steps 1–3 (Changesets name the changed packages; CI mirror gates the whole change).
- Cross-package: `@d3-polytree/ssr` tests read built `dist` of canvas/core/viewer — rebuild upstream before running ssr tests directly (`CLAUDE.md:97-99`).

---

### Step 1 — Deterministic/injectable id generation in `@d3-polytree/canvas`

**Status**: `pending`
**Files**:
- `packages/canvas/src/IdGenerator.ts` — create
- `packages/canvas/src/ElementRegistry.ts` — modify
- `packages/canvas/src/module.ts` — modify
- `packages/canvas/src/index.ts` — modify

**Evidence**:
- Non-deterministic source: `private readonly _ids = new Ids([8, 24, 86]);` (`ElementRegistry.ts:12`); used at `claim` (`:17`), `claimId` (`:23-25` — `element.id = element.id || this._ids.nextPrefixed(\`${prefix}_\`, element)`), `unClaim` (`:31`), `removeElementById` (`:41`).
- didi requires `$inject` on a constructor with args (else `parseAnnotations` throws `No provider` at boot — design.md; sibling pattern `Canvas.$inject` `Canvas.ts:31`, `ElementBuilder.$inject` `ElementBuilder.ts:8`).
- `canvasModule` shape: `elementRegistry: ['type', ElementRegistry]` (`module.ts:13`).
- Existing direct constructions to keep green: `new ElementRegistry()` at `drawerTestUtils.ts:22`, `ElementRegistry.test.ts:6,14,22`, `ElementBuilder.test.ts:7` (all no-arg).
- Canvas index export list (`index.ts:1-14`).

**Instructions**:
- `IdGenerator.ts`: export `interface IdGenerator { nextPrefixed(prefix: string, element?: unknown): string; claim(id: string, element?: unknown): void; unclaim(id: string): void }`. Export `class IdsIdGenerator implements IdGenerator` wrapping `private readonly _ids = new Ids([8, 24, 86])` and delegating the three methods verbatim (import `Ids from 'ids'`, matching `ElementRegistry.ts:1`) — this is the behavior-preserving default. Export `class SequentialIdGenerator implements IdGenerator`: a `private readonly _claimed = new Set<string>()` and `private readonly _counters = new Map<string, number>()`; `claim(id)` → `_claimed.add(id)`; `unclaim(id)` → `_claimed.delete(id)`; `nextPrefixed(prefix)` → increment the per-prefix counter and loop `const candidate = \`${prefix}${n}\`` while `_claimed.has(candidate)`, then `claim(candidate)` and return it — so a candidate matching an already-claimed id is skipped, never re-emitted. (Note `ElementRegistry.claimId` passes the prefix already including the trailing `_`, e.g. `node_`, so `nextPrefixed('node_')` yields `node_1`.)
- `ElementRegistry.ts`: replace the inline field with `static readonly $inject = ['idGenerator'];` and `constructor(private readonly _ids: IdGenerator = new IdsIdGenerator()) {}` (import `IdGenerator`/`IdsIdGenerator` from `./IdGenerator`; drop `import Ids from 'ids'`). All `this._ids.<m>` call sites are unchanged (interface mirrors the `ids` method names).
- `module.ts`: add `idGenerator: ['type', IdsIdGenerator],` to `canvasModule` (import `IdsIdGenerator`). Keep `elementRegistry: ['type', ElementRegistry]` — didi now resolves its `$inject: ['idGenerator']` from this token.
- `index.ts`: add `export { IdsIdGenerator, SequentialIdGenerator } from './IdGenerator'; export type { IdGenerator } from './IdGenerator';`.

**Verification**: `pnpm --filter @d3-polytree/canvas typecheck`; `pnpm --filter @d3-polytree/canvas exec vitest run` (all existing canvas tests green via the default arg); then rebuild canvas and `pnpm --filter @d3-polytree/core exec vitest run src/Diagram.test.ts` (the `get('elementRegistry')` boot path resolves the new token). `pnpm lint`.

**Test**: `packages/canvas/src/IdGenerator.test.ts` (new). Assert: `IdsIdGenerator.nextPrefixed('node_')` returns distinct ids (smoke); `SequentialIdGenerator` yields `node_1,node_2` then `label_1`; with a fresh `SequentialIdGenerator`, `claim('node_2')` then repeated `nextPrefixed('node_')` yields `node_1` then `node_3` (never the claimed `node_2`); `unclaim('node_2')` then frees it for reuse. Also assert `new ElementRegistry()` still works (default arg) and `new ElementRegistry(new SequentialIdGenerator())` mints `node_1` via `claimId({}, 'node_')`. Run: `pnpm --filter @d3-polytree/canvas exec vitest run src/IdGenerator.test.ts`.

---

### Step 2 — Scaffold the `@d3-polytree/ssr` package

**Status**: `pending`
**Files**:
- `packages/ssr/package.json` — create
- `packages/ssr/tsup.config.ts` — create
- `packages/ssr/tsconfig.json` — create
- `packages/ssr/vitest.config.ts` — create
- `packages/ssr/src/index.ts` — create (stub)
- `packages/ssr/README.md` — create

**Evidence**:
- Scaffold template: `packages/canvas/package.json` (exports-triple `:11-17`, `files:["dist"]`, `sideEffects:false`, `scripts` build/typecheck/test `:22-26`, `publishConfig.access:public`), `packages/canvas/tsup.config.ts` (esm+cjs+dts+clean+sourcemap+external), `packages/canvas/tsconfig.json` (extends base, outDir/rootDir/include), `packages/canvas/vitest.config.ts` (`environment: 'jsdom'`).
- Workspace dep pattern: `"@d3-polytree/core": "workspace:*"` (`viewer/package.json:28-30`).
- Workspace auto-includes `packages/*` (recon: `pnpm-workspace.yaml`); turbo auto-joins via `build`/`typecheck`/`test` scripts.
- jsdom is a root devDep `^25.0.1` (`package.json`).

**Instructions**:
- `package.json`: mirror canvas — `"name": "@d3-polytree/ssr"`, `"version": "0.1.0"`, description, MIT/author, `type:module`, main/module/types → dist triple, exports triple, `files:["dist"]`, `sideEffects:false`, scripts `build:tsup`/`typecheck:tsc --noEmit`/`test:vitest run`, `repository.directory:"packages/ssr"`, homepage, `publishConfig.access:public`. Dependencies: `"@d3-polytree/viewer": "workspace:*"`, `"@d3-polytree/core": "workspace:*"`, `"@d3-polytree/canvas": "workspace:*"`, `"jsdom": "^25.0.1"`. devDependencies: `"@types/jsdom": "^21.1.7"`.
- `tsup.config.ts`: `entry:['src/index.ts']`, `format:['esm','cjs']`, `dts:true`, `clean:true`, `sourcemap:true`, `external:['jsdom']` (and the workspace deps are external by default).
- `tsconfig.json`: identical to canvas's (extends base, outDir/rootDir/include).
- `vitest.config.ts`: `{ test: { environment: 'jsdom' } }` (mirrors canvas).
- `src/index.ts`: `export async function renderToSvg(_xml: string, _options?: { idGenerator?: import('@d3-polytree/canvas').IdGenerator }): Promise<string> { throw new Error('not implemented'); }` (stub, filled in Step 3).
- `README.md`: one-paragraph purpose + `renderToSvg` usage.
- Run `pnpm install` so the workspace links the new package and jsdom/@types/jsdom resolve.

**Verification**: `pnpm install` succeeds; `pnpm --filter @d3-polytree/ssr typecheck` passes on the stub; `pnpm --filter @d3-polytree/ssr build` emits `dist`. `pnpm lint`.

**Test**: N/A (scaffold only; real tests land in Step 3).

---

### Step 3 — Implement `renderToSvg` (jsdom host + pre-claim + mutex)

**Status**: `pending`
**Files**:
- `packages/ssr/src/dom.ts` — create (installDom/uninstallDom)
- `packages/ssr/src/index.ts` — modify (renderToSvg + mutex + preclaim)
- `packages/ssr/src/renderToSvg.test.ts` — create

**Evidence**:
- Render pipeline: `Viewer.importDiagram(xml)` (`viewer/src/index.ts:70`) → `exportSVG()` (`:93-95`).
- Last-def-wins override: `new Viewer({ modules: [...] })` composes after the component modules (`viewer/src/index.ts:129-134`).
- Globals the base path reads: `document` (`Canvas.ts:11-12,105`), `DOMParser` (`IconLoader.ts:79`, eager via `iconLoaderModule`←`nodesModule`, `draw/index.ts:51-54,86-89`), `XMLSerializer` (`SvgExportingUtils.ts:13`); Node 20 exposes none.
- Pre-claim source: `loadModel(xml)` → `ModelHost.definitions` (`model/model.ts:5,52`); collections via `definitions.get('node'|'link'|'label'|'zone')` (moddle `isMany`); claim timing interleaved during boot (`BaseElement.ts:102,142-147`).

**Instructions**:
- `dom.ts`: `installDom(): string[]` — `const { window } = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true })`; for each `key of Object.getOwnPropertyNames(window)`: if `key in globalThis` continue; else `Object.defineProperty(globalThis, key, Object.getOwnPropertyDescriptor(window, key)!)` inside try/catch, collecting added keys; return them. `uninstallDom(added: string[]): void` — `for (const k of added) { try { delete (globalThis as Record<string,unknown>)[k]; } catch {} }`. Comment the add-only rationale (don't clobber intrinsics; design Open Risk on coincidentally-present globals).
- `index.ts`: a module-level `let _chain: Promise<unknown> = Promise.resolve();` serial mutex — `renderToSvg` wraps its body so calls queue. Body: `const gen = options?.idGenerator ?? new SequentialIdGenerator()`; `const added = installDom()`; `try { const host = await loadModel(xml); preclaimIds(host.definitions, gen); const viewer = new Viewer({ container: document.body, modules: [{ idGenerator: ['value', gen] }] }); await viewer.importDiagram(xml); const svg = viewer.exportSVG(); viewer.destroy(); return svg; } finally { uninstallDom(added); }`. `preclaimIds(definitions, gen)`: for `prop of ['node','link','label','zone']`, `const col = (definitions.get(prop) ?? []) as Array<{id?: unknown}>; for (const el of col) if (typeof el.id === 'string' && el.id) gen.claim(el.id)`. Import `loadModel` from `@d3-polytree/core`, `Viewer` from `@d3-polytree/viewer`, `SequentialIdGenerator`/`IdGenerator` from `@d3-polytree/canvas`.
- Keep the public API `renderToSvg(xml, options?: { idGenerator?: IdGenerator }): Promise<string>`.

**Verification**: rebuild upstream (`pnpm --filter @d3-polytree/canvas --filter @d3-polytree/pfdn-moddle --filter @d3-polytree/core --filter @d3-polytree/viewer build`), then `pnpm --filter @d3-polytree/ssr exec vitest run`. `pnpm typecheck`; `pnpm lint`.

**Test**: `packages/ssr/src/renderToSvg.test.ts` (new). Assert: (a) `renderToSvg(FIXTURE_XML)` — where `FIXTURE_XML` is a small inline `.pfdn` string defined in the test file, carrying an author-set `<node id="node_1" …>` — returns a string starting with `<svg` and containing `element-id="node_1"` (the author-set id preserved); (b) **determinism** — rendering the same xml twice yields byte-identical strings; (c) **deterministic generation** — a diagram with an id-less node renders with a `node_1`-style id and is stable across two renders; (d) **no collision** — a mixed-id diagram (author `node_1` + an id-less node) does not emit a duplicate `node_1` (pre-claim skips it); (e) globals restored — after `renderToSvg`, `('document' in globalThis)` matches its pre-call state (in the vitest jsdom env `document` pre-exists, so it must remain; assert `renderToSvg` did not delete a pre-existing global). All fixtures are inline `.pfdn` strings in the test file (ssr has no editor dependency). Run: `pnpm --filter @d3-polytree/ssr exec vitest run src/renderToSvg.test.ts`.

---

### Step 4 — Changesets + CI mirror gate

**Status**: `pending`
**Files**:
- `.changeset/<name>.md` — create (canvas minor)
- `.changeset/<name>.md` — create (ssr new)

**Evidence**:
- Changesets flow (`.changeset/README.md`, `CLAUDE.md` Releases); a changeset is a markdown file with frontmatter `"@d3-polytree/<pkg>": <bump>`.
- CI order to mirror: install → lint → typecheck → test → build → build-storybook (`.github/workflows/ci.yml`, `CLAUDE.md:34`).

**Instructions**:
- Add a changeset for `@d3-polytree/canvas` **minor**: "Add an injectable `IdGenerator` (default `IdsIdGenerator`, deterministic `SequentialIdGenerator`) and an `idGenerator` DI token; `ElementRegistry` now accepts an injected generator (back-compatible default)."
- Add a changeset for `@d3-polytree/ssr` **minor** (initial `0.1.0`, per the design): "New package: render a `.pfdn` document to a static SVG string in Node via `renderToSvg`."

**Verification**: full CI mirror — `pnpm install --frozen-lockfile` (or `pnpm install` if the lockfile changed from the new dep, then commit the lockfile) `&& pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook`, all green (`CLAUDE.md:34-35`).

**Test**: N/A (changesets + verification only).

---

## Review Log

### 2026-09-18 — plan-review — passed-with-warnings

Reviewer verdict: **PASS WITH WARNINGS**, **0 blockers**. Every code-checkable citation resolves; the
plan faithfully implements the approved design (injectable `$inject`+token, add-only jsdom install,
double-parse pre-claim, collision-safe generator, serial mutex, jsdom direct dep) and reintroduces no
rejected alternative or host-rule violation; the reviewer independently confirmed the collision logic
(after `claim('node_2')` the generator emits `node_1` then `node_3`, never `node_2`) and back-compat
of the default-arg constructor. Three warnings, all cosmetic/execution-detail — **all addressed**
(none waived):

- **Step 3 Test referenced a non-existent `EDITOR_INITIAL_DIAGRAM_XML`** (editor exposes only a private
  `INITIAL_DIAGRAM`, and ssr has no editor dep) → fixed: the test uses inline `.pfdn` fixture strings
  defined in the test file.
- **Step 4 ssr changeset was left conditional** → fixed: committed to a `@d3-polytree/ssr` **minor**
  changeset at initial `0.1.0`, per the design.
- **Step 1 Test prose for the pre-claim case was garbled** → reworded to state the invariant plainly.

Plan is execution-ready.

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the step number, what changed, and why._
