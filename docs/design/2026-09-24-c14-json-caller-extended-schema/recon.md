# Recon: c14-json-caller-extended-schema

**Created**: 2026-09-24
**Change**: Thread caller packages (`createPfdnModdle(extraPackages)`) through the JSON `validate`/`fromJson` path (and `core`'s `loadModelFromJson`) so JSON documents round-trip caller-extended moddle models the way XML already does (roadmap C14, `ROADMAP.md:537`).
**Depth**: full
**Affected areas**: `packages/pfdn-moddle/src`, `packages/core/src/model`

---

## Repo Profile

pnpm + Turbo monorepo; `@d3-polytree/pfdn-moddle` owns the `.pfdn` moddle model (XML via moddle-xml, plus a descriptor-driven JSON adapter added in C11). Generated artifacts (`*.generated.ts`) are re-derived in CI and gated by `git diff --exit-code`. Tooling: vitest, tsc, eslint, prettier; CI install→lint→format→typecheck→test→build→build-storybook.

## Codebase Map

- **`packages/pfdn-moddle/src`** (TS)
  - JSON adapter: `packages/pfdn-moddle/src/json.ts`
    - `validate(doc, opts={lax?}) : Result<PfdnDocument>` `:134` — reads generated `SCHEMA`/`CONCRETE_TYPES` (import `:19`) at `:152` (`CONCRETE_TYPES.includes`), `:160-161`, `:168`, `:178`, `:193`, `:237`. Two-pass ref logic: pass 1 `walk` `:145-224` collects ids `:189` + refs `:199`; pass 2 `:227-244`.
    - `fromJson(doc, opts={lax?}) : Result<ModelElement>` `:324` → `buildTree`.
    - `buildTree(doc)` `:270-317` — **base-only** moddle: `new PfdnModdle({ pfdn: pfdnPackage })` `:271`; drives creation off `SCHEMA` `:277`, `moddle.create(type, attrs)` `:296`; two-pass re-link `:306-315`.
    - `toJson(element)` `:105` — descriptor-driven (`$descriptor`, `:76-102`); **already extension-safe** (no SCHEMA use).
    - `assertValid(doc)` `:250-251`.
  - Moddle factory: `packages/pfdn-moddle/src/index.ts` — `createPfdnModdle(additionalPackages={}, options?)` `:33-38` **already merges extra packages** (`{ ...packages, ...additionalPackages }`).
  - XML precedent: `packages/pfdn-moddle/src/PfdnModdle.ts` — `fromXML(...)` `:47-54` builds `Reader({ model: this, ... })` (reads against the live moddle → extended types parse free); `toXML` `:57-59` walks live `$descriptor`.
  - Generated schema: `packages/pfdn-moddle/src/pfdn.generated.ts` — `PropInfo` `:132-139`, `TypeInfo {abstract, allTypesByName, properties}` `:141-145`, `SCHEMA: Record<string,TypeInfo>` `:148-311`, `CONCRETE_TYPES` `:314`.
  - Generator: `packages/pfdn-moddle/scripts/generate-pfdn.mjs` (Node stdlib) — reads `src/pfdn.json`, `resolveProps` `:22-38`, `allTypes` `:41-47`, emits interfaces + SCHEMA + CONCRETE_TYPES.
  - Tests: `packages/pfdn-moddle/src/json.test.ts` (253 lines, vitest) — `buildSharpModel()` oracle `:19-64`, round-trip gates `:99-140`, validate error table `:142-231`.
- **`packages/core/src/model`** (TS)
  - `loadModelFromJson(input, opts={lax?})` `model.ts:91-122` → `fromJson(doc, opts)` `:108`; adopts the moddle `buildTree` built via `definitions.$model` `:113-114`. **No packages parameter today** → JSON-loaded models are base-only in core.
  - `loadModel` (XML) `:61-76`, `emptyModel` `:54-58` both call `createPfdnModdle()` no-arg.
  - Tests: `packages/core/src/model/loadModelFromJson.test.ts` (59 lines).

## Patterns to REUSE

- Caller-extension seam → reuse `createPfdnModdle(additionalPackages)` (`index.ts:33-38`) inside `buildTree` instead of `new PfdnModdle({pfdn})` (`json.ts:271`).
- Live-model reading → mirror XML's `model: this` (`PfdnModdle.ts:47-54`) and `toJson`'s `$descriptor` walk (`json.ts:76-102`) so `validate`/`buildTree` read per-type info from a live moddle rather than the frozen `SCHEMA`.
- Ground-truth test oracle → reuse `buildSharpModel()` (`json.test.ts:19-64`) style; add an extended-package fixture.
- The generated `TypeInfo`/`PropInfo` shape (`pfdn.generated.ts:132-145`) is the contract any "supplemental descriptor" must reduce to.

## Host Conventions & Hard Rules

- **Hard rule** (root `CLAUDE.md` `PLAT-04` / "never hand-edit generated files"): caller-extended types must be threaded at **runtime**, never baked into `pfdn.generated.ts` — the CI drift gate (`.github/workflows/ci.yml:40-51`, `git diff --exit-code` on `*.generated.ts`) would fail otherwise.
- **Hard rule** (root `CLAUDE.md`): "all tooling is Python 3 stdlib only"/no new deps — but this is the JS side; keep zero new runtime deps in pfdn-moddle.
- **Hard rule** (root `CLAUDE.md`, C11 note / O1): the JSON path is "additive… over the *same* moddle model" — C14 must not fork the model or diverge JSON semantics from XML.
- **Hard rule** (`ROADMAP.md:537`): the goal is JSON round-trips extended models "the way XML already does" — parity with `fromXML`/`toXML` is the acceptance bar.
- Convention: `packages/pfdn-moddle/CLAUDE.md` — `Node.label` is an IDREF not a string; refs collapse to id in JSON.

## Dependencies

- Data / schema: the moddle model; a caller Package is `{ name, uri, prefix, associations, types[] }` (the `pfdn.json` shape) keyed by prefix.
- External contracts: **public API change** — `validate`, `fromJson`, `assertValid` (`json.ts`) and `loadModelFromJson` (`core/model.ts`) gain a way to pass caller packages/moddle. Additive optional parameter preferred (backward-compatible).
- Config / environment: none.
- Cross-area edges: `core` → `pfdn-moddle` JSON API; every `createPfdnModdle()` call site.

## Risks / Not-found

- **Two viable threadings** (design fork): (a) pass a **live `PfdnModdle`** (or extra packages) and derive per-type info from `$descriptor` on demand (mirrors `fromXML`); (b) accept a **supplemental `TypeInfo`/`CONCRETE_TYPES` table** merged over the base at call time and build the moddle via `createPfdnModdle(extraPackages)`. Both avoid the drift gate.
- **Ledger trap `2026-09-18 deterministic-ids-ssr` (didi `$inject`)**: not directly in scope, but any new constructor-arg service needs `$inject`.
- Not found: any existing test that round-trips an extended package through JSON — created from scratch.
- Reference-type checks (`json.ts:237`, `SCHEMA[targetType].allTypesByName`) must resolve extended target types, else a valid extended ref fails `refType`.

## Recommended Scope

Refactor `validate`/`buildTree` to operate against a caller-supplied schema source (live moddle `$descriptor` or a merged `SCHEMA`/`CONCRETE_TYPES`), defaulting to the base generated tables when none is supplied (zero behavior change for existing callers). Thread an additive optional argument through `fromJson`/`assertValid` (pfdn-moddle) and `loadModelFromJson` (core). Add extended-package round-trip + validate fixtures. The chosen threading (a vs b) is the debate's central fork.
