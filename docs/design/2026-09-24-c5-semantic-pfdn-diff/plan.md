# Implementation Plan: c5-semantic-pfdn-diff

**Status**: `pending`
**Created**: 2026-09-24
**Design**: [design.md](./design.md)
**Test harness**: `pnpm --filter @d3-polytree/diff test` (vitest, node env; new package) and `pnpm --filter @d3-polytree/pfdn-moddle build` (for the `/schema` subpath). CI runs `turbo run test`/`build`.
**Total Steps**: 5
**Review**: `passed @ 2026-09-24`

---

## Execution Summary

Expose the runtime schema first (Step 1: pfdn-moddle `/schema` subpath — a dependency the diff engine imports), scaffold the pure package (Step 2), implement the engine (Step 3), test it (Step 4), then catalog + changesets + CI parity (Step 5). Step 1 must land first because Steps 2–3 import `@d3-polytree/pfdn-moddle/schema`.

## Step Dependencies

- Step 2 requires Step 1 (diff's `dependency` resolves the `/schema` subpath).
- Step 3 requires Steps 1–2.
- Step 4 requires Step 3.
- Step 5 requires Steps 2–4 (root README row + both changesets; full build).

---

### Step 1 — Add the `@d3-polytree/pfdn-moddle/schema` subpath

**Status**: `pending`
**Files**:

- `packages/pfdn-moddle/src/schema.ts` — create
- `packages/pfdn-moddle/tsup.config.ts` — modify
- `packages/pfdn-moddle/package.json` — modify

**Evidence**:

- `pfdn.generated.ts` is import-free (banner `:1-3`, zero imports — adversary-verified pure), exports `SCHEMA` `:148`, `CONCRETE_TYPES` `:314`, `TypeInfo`/`PropInfo` `:132-145`. `index.ts:10-25` re-exports **types only**, not the runtime consts.
- 2nd-entry precedent: `packages/layout/tsup.config.ts:6` (`entry` array), `packages/layout/package.json` `./worker` export block; `"files":["dist"]` already ships built entries.

**Instructions**:

1. Create `src/schema.ts`: `export { SCHEMA, CONCRETE_TYPES } from './pfdn.generated'; export type { PropInfo, TypeInfo } from './pfdn.generated';`.
2. `tsup.config.ts`: change `entry` to `['src/index.ts', 'src/schema.ts']`.
3. `package.json` `exports`: add a `"./schema"` entry mirroring `"."` (`{ types: ./dist/schema.d.ts, import: ./dist/schema.js, require: ./dist/schema.cjs }`). Do **not** touch `pfdn.generated.ts` or the generator (PLAT-04 / drift gate).

**Verification**: `pnpm --filter @d3-polytree/pfdn-moddle build` emits `dist/schema.{js,cjs,d.ts}`; `node -e "require('@d3-polytree/pfdn-moddle/schema')"` from the package dir resolves `SCHEMA`; `pnpm --filter @d3-polytree/pfdn-moddle generate && git diff --exit-code packages/pfdn-moddle/src/pfdn.generated.ts` stays clean.

**Test**: N/A (build-surface only; exercised by Step 4 via the diff engine importing it).

---

### Step 2 — Scaffold `@d3-polytree/diff`

**Status**: `pending`
**Files**:

- `packages/diff/package.json` — create
- `packages/diff/tsup.config.ts` — create
- `packages/diff/tsconfig.json` — create
- `packages/diff/src/index.ts` — create
- `packages/diff/README.md` — create

**Evidence**:

- Pure-package template `packages/layout`: `package.json` (dual ESM/CJS exports, `sideEffects:false`, scripts `build:tsup`/`typecheck`/`test:vitest run`), `tsup.config.ts`, `tsconfig.json` (extends `../../tsconfig.base.json`), `src/index.ts` barrel; no `vitest.config.ts` (node env). Workspace auto-globs `packages/*` (`pnpm-workspace.yaml`) — no edit.
- README rules `docs/README-template.md`: section order `:19-21`, absolute `/tree/main/` URLs `:28-30`, pure-logic no-demo `:78-79`, `MIT © David Castillo` `:131`.

**Instructions**:

1. `package.json`: name `@d3-polytree/diff`, version `0.0.0`, `type:module`, dual `exports`/`main`/`module`/`types`, `files:["dist"]`, `sideEffects:false`, `publishConfig.access:public`, `repository.directory:"packages/diff"`, `homepage` `.../tree/main/packages/diff#readme`, scripts `build:"tsup"`/`typecheck:"tsc --noEmit"`/`test:"vitest run"`, `dependencies: { "@d3-polytree/pfdn-moddle": "workspace:*" }`.
2. `tsup.config.ts`: `entry:['src/index.ts']`, `format:['esm','cjs']`, `dts:true`, `clean:true`, `sourcemap:true`, `external:['@d3-polytree/pfdn-moddle']`.
3. `tsconfig.json`: extends `../../tsconfig.base.json`, `outDir:dist`, `rootDir:src`, `lib:["ES2020"]` (no DOM/WebWorker).
4. `src/index.ts`: `export { diff, DiffError } from './diff'; export type { DiffOp, DiffKind, CollectionKind, Coord } from './diff';`.
5. `README.md` from the template skeleton (title+intro → `## Install` → feature/API table → `## Usage` → `## API` → `## Links` → `## License` `MIT © David Castillo`); absolute `/tree/main/` links; no live-demo line.

**Verification**: `pnpm install` links the workspace; `pnpm --filter @d3-polytree/diff typecheck` passes (after Step 3 supplies `./diff`).

**Test**: N/A (scaffold).

---

### Step 3 — Implement the diff engine

**Status**: `pending`
**Files**:

- `packages/diff/src/diff.ts` — create

**Evidence**:

- Op field mapping from `pfdn.generated.ts`: id `:156-164`; Node fields `:63-74` (`type` `:69`, `position` `:72`, refs `label` `:245`/`propertiesSet` `:248`); Link `:96-111` (`source`/`target` `:285-286`, `waypoint` `:290`, `pinned` `:291`, refs `label`/`propertiesSet` `:284,293`); Zone `:82-93` (`position`, `border` `:274`, ref `label` `:268`); Label `:51-61` (`position` `:231`); PropertiesSet `:12-17`; Diagram root `status`/`name` `:300,302`, collections `:304-308`; Coordinates `Real` `:188-189`.
- Canonical input: `toJson` collapses refs `json.ts:90,93`, omits defaults `json.ts:6`.
- `SCHEMA`/`CONCRETE_TYPES` imported from `@d3-polytree/pfdn-moddle/schema` (Step 1); `import type { PfdnDocument }` (**named**) from `@d3-polytree/pfdn-moddle`.

**Instructions**:
Implement per design: the frozen `DiffOp` union + `Coord`/`DiffKind`/`CollectionKind`; `class DiffError extends Error`; `diff(a, b)`:

1. Validate single-root ids match (`DiffError` on mismatch/missing).
2. For each of the five collections, build `Map<id, element>` from `a`/`b` (fail-fast `DiffError` on a member lacking `id`); union-of-ids → `added`/`removed`/compared.
3. For a compared element: emit `retyped` (`Node.type`), `reattached` (`Link.source`/`target`), `moved` (`Node`/`Zone`/`Label` `position` via `deepEq` on `Coord`), pinned-`waypoint` `modified` (only when `Link.pinned` on either side), then the generic SCHEMA-driven `modified` walk over the type's `properties` **minus** `MODIFIED_CARVE_OUTS[kind]` and any `isId` field (covers scalars + single-ref leaves + `border` + `pinned`).
4. Diagram root: emit `modified{kind:'Diagram'}` for `status`/`name` (carve out `settings` + the five collections).
5. Equality: `eq(x,y) = x===y || (Number.isNaN(x)&&Number.isNaN(y))`; `deepEq` for `Coord`/`Border`/`property[]`/`waypoint[]`.
6. Emit in the total order (design "Determinism").

**Verification**: `pnpm --filter @d3-polytree/diff typecheck` passes; Step 4 tests green.

**Test**: paired in Step 4.

---

### Step 4 — Diff engine tests

**Status**: `pending`
**Files**:

- `packages/diff/src/diff.test.ts` — create

**Evidence**: `layout.test.ts` fixture idiom (`import { describe, expect, it } from 'vitest'`, inline literals, determinism `expect(f(x)).toEqual(f(x))` `:112-124`). Ground-truth doc build via `@d3-polytree/pfdn-moddle` `toJson`.

**Instructions**: Vitest cases — one per op: `added`/`removed` (element only in b / a); `moved` (position change); `retyped` (`Node.type`); `reattached` (`Link.source`/`target`, only changed endpoint present); `modified` scalar (`Node.name`/`Zone.fillColor`), single-ref leaf (`Node.label` id change), Diagram root (`status`), `pinned`-toggle, and pinned-`waypoint`. Plus: unpinned waypoint change emits **nothing**; identical docs → `[]` (incl. NaN coords → no phantom); determinism + order-stability (shuffle `b.node[]` → identical ops); missing id → `DiffError`; a change covered by a structural op is **not** double-emitted as `modified`.

**Verification**: `pnpm --filter @d3-polytree/diff test` all green; each test fails against a stubbed/empty `diff`.

**Test**: this step is the test.

---

### Step 5 — Catalog, changesets, CI parity

**Status**: `pending`
**Files**:

- `README.md` (root) — modify (add a `@d3-polytree/diff` Packages-table row)
- `.changeset/c5-semantic-pfdn-diff.md` — create

**Evidence**: root README Packages table `README.md:15-30` (add a row mirroring `:29`); `.changeset/config.json` (`baseBranch: main`, `access: public`).

**Instructions**:

1. Add a root README row: `| [`@d3-polytree/diff`](./packages/diff) | Pure structural diff of two `.pfdn`documents → an ordered`DiffOp[]` (added/removed/moved/retyped/reattached/modified). |`.
2. Create the changeset:
   ```md
   ---
   '@d3-polytree/diff': minor
   '@d3-polytree/pfdn-moddle': minor
   ---

   Add @d3-polytree/diff: a pure structural diff over two .pfdn documents
   producing a deterministic DiffOp[]. Adds a pfdn-moddle "./schema" subpath
   exporting the runtime SCHEMA/CONCRETE_TYPES the diff engine consumes.
   ```
3. Full CI mirror in pipeline order (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook`.

**Verification**: the CI-mirror chain is green; the new package builds and its tests pass under `turbo`.

**Test**: N/A (catalog + verification).

---

## Review Log

### 2026-09-24 — plan-review — passed

- **Verdict**: PASS (reviewer agent); no blockers, no warnings. Every cited `path:line` resolves; `pfdn.generated.ts` confirmed import-free (so `/schema` is runtime-pure); the `layout` `./worker` 2nd-entry precedent verified; 6-op union + carve-outs + canonical-input honored; CI mirror matches `ci.yml`. Two NOTE-level items (Step 2 typecheck depends on Step 3; drift-gate covered by Step 1's own verification) require no action.

---

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the step number, what changed, and why._
