# Implementation Plan: c14-json-caller-extended-schema

**Status**: `pending`
**Created**: 2026-09-24
**Design**: [design.md](./design.md)
**Test harness**: `pnpm --filter @d3-polytree/pfdn-moddle test` and `pnpm --filter @d3-polytree/core test` (vitest; CI runs `turbo run test`)
**Total Steps**: 5
**Review**: `passed-with-warnings @ 2026-09-24`

> **Known limitation (extended packages)**: a caller-extended property that is redefined with a distinct moddle `effectiveType` may classify differently between the XML reader (`propertyDesc.effectiveType || propertyDesc.type`) and this JSON path (which reads `p.type`). Absent in base `pfdn.json`; documented here per the design's Open Risks.

---

## Execution Summary

Introduce the `SchemaSource` seam and base provider first (Step 1, zero behavior change), then the live provider + branch point + `buildTree` wiring (Step 2), then the additive public signatures + core plumbing (Step 3), then tests incl. the blocker base-parity pin test (Step 4), then changesets + full CI parity (Step 5). The base path stays byte-identical throughout, so existing tests guard against regression at every step.

## Step Dependencies

- Step 2 requires Step 1 (the branch selects between base and live providers).
- Step 3 requires Steps 1–2 (signatures thread `packages` into the branch).
- Step 4 requires Steps 1–3.
- Step 5 requires Step 4.

---

### Step 1 — `SchemaSource` interface + base provider; re-source the walkers

**Status**: `pending`
**Files**:
- `packages/pfdn-moddle/src/json.ts` — modify

**Evidence**:
- SCHEMA/CONCRETE_TYPES reads to re-source: `json.ts:152` (`CONCRETE_TYPES.includes`), `:160`,`:237`,`:277` (`SCHEMA[type]`), plus dependent `.allTypesByName`/`.properties`/`.find(isId)` at `:161,168,178,193,297`. Import at `:19`.
- `TypeInfo`/`PropInfo` shapes `pfdn.generated.ts:132-145`; `BUILTINS` `json.ts:24`.

**Instructions**:
1. Define `interface SchemaSource { isConcrete(type: string): boolean; typeInfo(type: string): TypeInfo | undefined; }`.
2. Define `const baseSchema: SchemaSource = { isConcrete: (t) => CONCRETE_TYPES.includes(t), typeInfo: (t) => SCHEMA[t] };`.
3. Replace `CONCRETE_TYPES.includes(type)` (`:152`) with `schema.isConcrete(type)` and every `SCHEMA[type]`/`SCHEMA[targetType]` read (`:160,237,277`) with `schema.typeInfo(...)`, where `schema` is a parameter threaded into `validate`'s inner `walk` and into `buildTree` (default `baseSchema` for now). Keep the `undefined` handling at `:160` (the unknown/abstract `$type` branch) unchanged.

**Verification**: `pnpm --filter @d3-polytree/pfdn-moddle typecheck` and `pnpm --filter @d3-polytree/pfdn-moddle test` — existing `json.test.ts` byte-identical green (proves base path unchanged).

**Test**: existing `json.test.ts:142-231` is the regression guard; no new test in this step.

---

### Step 2 — `liveSchema` provider + branch point + `buildTree` moddle

**Status**: `pending`
**Files**:
- `packages/pfdn-moddle/src/json.ts` — modify

**Evidence**:
- `createPfdnModdle(additionalPackages, options)` `index.ts:33-38`. moddle 7.2.0 API (adversary-verified): `moddle.getType(name).prototype.$descriptor`, `moddle.getTypeDescriptor(name)` (raw, has `isAbstract`), `descriptor.allTypesByName` is an object, `descriptor.properties[].isVirtual`. `buildTree` base construction `json.ts:271`; `isId` read `:178,297`.
- `BUILTINS` 4-item set `json.ts:24` (matches moddle-xml `isSimpleType`).

**Instructions**:
1. Add `function liveSchema(moddle): SchemaSource` per design: strict 6-field projection (`name,type,isMany,isReference,isId,isSimple`), `isSimple: BUILTINS.has(p.type)`, `.filter(p => !p.isVirtual)`, `allTypesByName: Object.keys(d.allTypesByName)`, `isConcrete` via `getTypeDescriptor(t)` truthy && `!isAbstract`, `typeInfo` returns `undefined` for unknown types.
2. To avoid an `index.ts`↔`json.ts` import cycle (design Open Risk), import `PfdnModdle` and construct via `new PfdnModdle({ ...caller })` **locally in json.ts** (json.ts already imports `PfdnModdle` at `:17`), or add a cycle-free internal `createModdle` helper. Build the extended moddle from `opts.packages` merged over `{ pfdn: pfdnPackage }` (same spread `createPfdnModdle` does).
3. Branch in `validate` and `buildTree`: `const schema = opts.packages ? liveSchema(<extended moddle>) : baseSchema;`.
4. `buildTree`: replace `new PfdnModdle({ pfdn: pfdnPackage })` (`:271`) with the extended moddle (base `{ pfdn }` when no packages), so `moddle.create(extType)` resolves and `$model` carries extended packages. Thread `opts.packages` into `buildTree`'s signature.

**Verification**: `pnpm --filter @d3-polytree/pfdn-moddle typecheck`; existing tests still green (base path untouched); Step 4 extended tests green.

**Test**: paired in Step 4.

---

### Step 3 — Additive public signatures + core `loadModelFromJson`

**Status**: `pending`
**Files**:
- `packages/pfdn-moddle/src/json.ts` — modify
- `packages/core/src/model/model.ts` — modify

**Evidence**:
- `validate(doc, opts={lax?})` `json.ts:134`; `fromJson(doc, opts={lax?})` `:324`; `assertValid(doc)` `:250-251` (calls internal `validate`); `loadModelFromJson(input, opts={lax?})` `model.ts:91`, delegates to `fromJson` `:108`, `$model` reuse `:113-114`.

**Instructions**:
1. Widen opts: `validate(doc, { lax?, packages? })`, `fromJson(doc, { lax?, packages? })`, `assertValid(doc, { packages? })` — thread `packages` into `assertValid`'s internal `validate(doc, { packages })` (`:251`). `fromJson` passes `opts.packages` into **both** `validate` and `buildTree`.
2. `loadModelFromJson(input, { lax?, packages? })` forwards the whole `opts` to `fromJson` (`model.ts:108`). No change needed to `$model` reuse (`:114`) — the extended moddle `buildTree` built is what core adopts.

**Verification**: `pnpm --filter @d3-polytree/pfdn-moddle typecheck && pnpm --filter @d3-polytree/core typecheck`; no positional-arg call site breaks (`grep -rn "loadModelFromJson\|assertValid\|fromJson\|[^.]validate(" packages/*/src` → confirm all pass only `doc`/`input` positionally).

**Test**: paired in Step 4.

---

### Step 4 — Tests: base-parity pin (blocker), extended round-trip, core

**Status**: `pending`
**Files**:
- `packages/pfdn-moddle/src/json.test.ts` — modify (or a new `schema-source.test.ts`)
- `packages/core/src/model/loadModelFromJson.test.ts` — modify

**Evidence**:
- Vitest; `buildSharpModel()` oracle `json.test.ts:19-64`; validate error table `:142-231`. Core loader test file `loadModelFromJson.test.ts` (existing).

**Instructions**:
1. **Base-parity pin test (BLOCKER — DN-6/CI guard)**: for every key in `SCHEMA` and every member of `CONCRETE_TYPES`, assert `liveSchema(createPfdnModdle())` agrees with the generated tables — `isConcrete` equal; `typeInfo(t).abstract` equal; `allTypesByName` equal **as sets** (sort or `Set` compare — live is ancestor-first, generated self-first); `properties` equal as a `name → PropInfo` map (order-independent). Export `liveSchema` (or test via an internal test hook).
2. **Extended-package round-trip**: define a tiny extra moddle `Package` (e.g. `{ ext: { name, uri, prefix:'ext', types:[{ name:'Custom', superClass:['pfdn:Node'], properties:[...] }] } }`); assert `validate(doc, { packages })` accepts an `ext:Custom`-bearing doc and **fails** without `packages`; assert `fromJson(doc, { packages })` → `toJson` idempotence. Add an enum-typed custom property as defense-in-depth (adversary confirmed the simple/element decision matches XML).
3. **Core**: `loadModelFromJson(extendedDoc, { packages })` resolves; without `packages` it throws `PfdnValidationError`.

**Verification**: `pnpm --filter @d3-polytree/pfdn-moddle test && pnpm --filter @d3-polytree/core test` — all green; the pin test fails if `liveSchema` diverges from the generated tables for any base type.

**Test**: this step is the test.

---

### Step 5 — Changesets + CI parity

**Status**: `pending`
**Files**:
- `.changeset/c14-json-caller-extended-schema.md` — create

**Evidence**: `.changeset/config.json` (`baseBranch: main`, `access: public`); design specifies minor on both packages.

**Instructions**:
Create the changeset:
```md
---
"@d3-polytree/pfdn-moddle": minor
"@d3-polytree/core": minor
---
JSON adapter: thread caller-extended moddle packages through validate/fromJson
(and core loadModelFromJson) via a SchemaSource seam, so extended models
round-trip on the JSON path the way XML already does. Base path unchanged.
```
Then run the drift gate + full parity: regenerate and diff generated files, then `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

**Verification**: `pnpm --filter @d3-polytree/pfdn-moddle generate && git diff --exit-code packages/pfdn-moddle/src/pfdn.generated.ts` (drift gate stays clean — no generated-file change), then the full CI mirror in exact pipeline order (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook`.

**Test**: N/A (changeset + verification only).

---

## Review Log

### 2026-09-24 — plan-review — passed-with-warnings

- **Verdict**: PASS WITH WARNINGS (reviewer agent); no blockers — every cited `path:line` resolves, no step edits the generated file, two-provider design honored.
- **Warning 1 (addressed)**: design Open Risk "effectiveType-refined properties" was not surfaced in the plan → added a "Known limitation" note to the header.
- **Warning 2 (addressed)**: Step 5 CI mirror omitted `pnpm format:check` → Step 5 verification now lists the full CI order incl. `format:check` and `build-storybook`.

---

## Deviation Log

_Populated during execution. Step bodies above are immutable (DN-5); record any divergence here with the step number, what changed, and why._
