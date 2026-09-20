# Implementation Plan: json-adapter-validator (C11)

Derived from the approved `design.md` (deep debate; R5 clean SOUND). Steps are ordered so each is
independently verifiable. Every file path + line anchor was verified during recon/debate.

## Plan-level realization decision (flagged for plan-review)
The design mandates a "dependency-free validator + typed documents **generated from `pfdn.json`**". This plan
realizes the validator as **table-driven**: the generator emits (a) the TS interfaces and (b) a `SCHEMA`
descriptor table (per concrete type: its resolved property list, `abstract` flag, and `allTypesByName` set), and a
**hand-written, table-driven interpreter** (`validate`) consumes that table. Rationale: it is far less generated
code to review, has a single source of truth (the generated table distilled from `pfdn.json`), and **eliminates
the round-3 M1 hazard** (generated per-type validator functions risk `noUnusedLocals`/`noUnusedParameters`
violations that fail CI Typecheck). The contract from the design is unchanged: zero deps, generated from
`pfdn.json`, strict, collect-all `Result`, M2/M3/M4 checks intact. The interfaces are still generated TS text.

---

## Step 1 — Generator `packages/pfdn-moddle/scripts/generate-pfdn.mjs` (Node stdlib only)
Mirror `packages/icons-amazon/scripts/generate-icons.mjs` (readFileSync → writeFileSync a committed
`src/*.generated.ts`, "AUTO-GENERATED … do not edit" banner). Read `src/pfdn.json`. Emit **deterministic**
(schema array order, no timestamps, LF) `src/pfdn.generated.ts` containing:
- **Per CONCRETE type** an `export interface Pfdn<LocalName>`: `$type: '<prefix:LocalName>'` (literal, required);
  each resolved property (own + inherited via `superClass` chain, super-first — mirror `getEffectiveDescriptor`)
  typed by rule — `isReference` → `string`; simple builtin (`String`→`string`, `Real`/`Integer`→`number`,
  `Boolean`→`boolean`) → that scalar; complex → `Pfdn<Type>`; `isMany` → `T[]`; **defaulted props and `id`
  OPTIONAL** (`?`), everything else required-if-not-defaulted. Skip `isVirtual`.
- `export type PfdnDocument = PfdnDiagram;` and `export type PfdnElement = PfdnNode | PfdnLink | … ;` (concrete only).
- `export const SCHEMA: Record<string, TypeInfo>` where `TypeInfo = { abstract: boolean; superTypes: string[];
  allTypesByName: string[]; properties: PropInfo[] }` and `PropInfo = { name; type; isAttr; isMany; isReference;
  isId; isSimple; hasDefault; default? }`. `isSimple` = type is a moddle builtin (not `pfdn:`-prefixed).
  `allTypesByName` = self + all supertypes (for M4 assignability). Include ABSTRACT types in `SCHEMA` (for the
  supertype relation) but flag `abstract:true`; also `export const CONCRETE_TYPES: string[]`.
- The banner + a `/* eslint-disable */` line if the flat config lints generated files (verify against
  `eslint.config.js` ignores; icons.generated.ts precedent).
- Determinism note: iterate `pfdn.json.types` and each type's `properties` in array order; sets serialized sorted
  or in first-seen order consistently.

**Verify**: `node scripts/generate-pfdn.mjs` twice → byte-identical output; the file `tsc --noEmit`-clean under the
base tsconfig (no unused locals/params — a pure data+interface file has none).

## Step 2 — `packages/pfdn-moddle/package.json`
- `"build": "node scripts/generate-pfdn.mjs && tsup"` (mirror icons-amazon `:24`).
- add `"generate": "node scripts/generate-pfdn.mjs"`.
- No `exports`/`files`/tsup change needed: single `.` entry, tsup single-entry `src/index.ts` bundles the whole
  import graph (`tsup.config.ts`), `files:["dist"]` already ships the built output. `sideEffects:false` retained.
- Commit `src/pfdn.generated.ts` (like `icons.generated.ts`).

## Step 3 — `packages/pfdn-moddle/src/json.ts` (hand-written adapter + interpreter, pure)
Public types:
- `type Result<T> = { ok: true; value: T } | { ok: false; errors: ValidationError[] }`.
- `interface ValidationError { instancePath: string; keyword: string; message: string }`.
- `class PfdnValidationError extends Error { readonly errors: ValidationError[] }`.
- brand: `declare const brand: unique symbol; type ValidatedPfdnDocument = PfdnDocument & { readonly [brand]: 'valid' }`.

`toJson(element: ModelElement): PfdnDocument` — descriptor walk on `element.$descriptor.properties`, read RAW
`element[p.name]`, omit predicate `hasOwnProperty(element,p.name) && v !== p.default && v !== null && (p.isMany ?
v.length : true)`, skip `isVirtual`; per prop ORDER: (1) `isReference` → `v.id`; (2) `isSimple` → scalar; (3)
nested `toJson(v)` / array `v.map(toJson)`. Always write `$type` = `element.$type`. Pure (no moddle instance).

`validate(doc: unknown, opts?: { lax?: boolean }): Result<PfdnDocument>` — table-driven over `SCHEMA`. Two internal
passes: **(P1)** recursively walk `doc`, checking per node: `$type` present + in `CONCRETE_TYPES`; each key is a
known property (else unknown-key error, keyword `additionalProperties`); child `$type` assignable to the holding
property (`SCHEMA[child.$type].allTypesByName.includes(property.type)`, M2/M4); primitive `typeof` match; `isMany`
→ `Array.isArray`; collect the `id` of every `isId`-typed node into a `Map<id, $type>` (duplicate → error, M:
`uniqueId`); recurse children. **(P2)** for every `isReference` value, look up id in the map — missing → error
(`refResolvable`; hard unless `opts.lax`, then a collected warning + treat as drop), present but resolved
`$type` not assignable to `property.type` → error (`refType`, M3). Collect ALL errors with JSON-Pointer
`instancePath`. Strict-clean with explicit `typeof`/`Array.isArray`/`in` guards (no `noUncheckedIndexedAccess`).

`fromJson(doc: unknown, opts?: { lax?: boolean }): Result<ModelElement>` — accepts object (string handled by
`loadModelFromJson`). `const r = validate(doc, opts); if (!r.ok) return r;` then build with an internally-created
`createPfdnModdle()`: **P1** recursively `moddle.create($type, plainAttrsAndChildren)` — build every sub-element
individually (moddle `create` does not recurse into plain objects), OMIT `isReference` props, index every created
element by id; **P2** for each `isReference`, `element.set(name, index.get(id))` (non-enumerable storage). Return
`{ ok:true, value: root }`. Throws only on a non-object/non-string argument (programmer error).

`assertValid(doc: unknown): asserts doc is ValidatedPfdnDocument` — `const r = validate(doc); if (!r.ok) throw new
PfdnValidationError(r.errors);`.

## Step 4 — `packages/pfdn-moddle/src/index.ts`
Add: `export { toJson, fromJson, validate, assertValid, PfdnValidationError } from './json';`
`export type { Result, ValidationError, ValidatedPfdnDocument } from './json';`
`export type { PfdnDocument, PfdnElement, PfdnNode, PfdnLink, PfdnLabel, PfdnZone, PfdnCoordinates, PfdnSettings,
… } from './pfdn.generated';` (`export type` per `verbatimModuleSyntax`). No collision with existing exports
(`PfdnModdle`/`createPfdnModdle`/`FromXmlOptions`/`ModelElement`/`ParseResult`).

## Step 5 — `packages/core/src/model/model.ts` — `loadModelFromJson`
Add beside `loadModel` (`:54-69`), auto-exported via `core/src/index.ts:36`:
```
export async function loadModelFromJson(
  input: string | PfdnDocument,
  opts?: { lax?: boolean },
): Promise<ModelHost> { … }
```
- If `typeof input === 'string'`: `JSON.parse` inside try/catch → on `SyntaxError` throw `PfdnValidationError`
  with a single `{instancePath:'', keyword:'json', message}` (one failure channel).
- `const r = fromJson(parsed, opts); if (!r.ok) throw new PfdnValidationError(r.errors);` (strict default; `{lax}`
  passes through). Loud JSDoc: documents the divergence from `loadModel`'s XML lax-tolerance + the `{lax}` opt-in.
- `const definitions = r.value; ensureSettings(moddle, definitions); routeLinks(definitions, …);` mirroring
  `loadModel` (`:56-67`) — reuse the SAME `ensureSettings` (`:22-44`) and `routeLinks` (`:63`). Return
  `{ definitions, moddle }`. (Obtain `moddle` from the same `createPfdnModdle()` used to build, or re-create — the
  registry is stateless; simplest: `fromJson` returns the element and `loadModelFromJson` creates its own moddle
  for `ensureSettings`. Prefer having `fromJson` also surface the moddle it built with to avoid a second instance —
  decide in impl, both are correct.)
- Import `fromJson`, `PfdnDocument`, `PfdnValidationError` from `@d3-polytree/pfdn-moddle`.

## Step 6 — `.github/workflows/ci.yml` drift gate
After the **Build** step (`ci.yml:13-38`), add:
```
- name: Verify generated files are up to date
  run: git diff --exit-code -- packages/pfdn-moddle/src/pfdn.generated.ts
```
Build regenerates the file (Step 2 build script); a stale committed file fails the diff. Turbo guard: confirm
`turbo.json` `build.outputs` is `["dist/**"]` (already true — generated source is NOT an output, so no cache can
restore a stale copy). No `.turbo`/remote cache in CI today.

## Step 7 — Tests
**`packages/pfdn-moddle/src/json.test.ts`** (pure, no DOM):
- **Gate 1 idempotence**: `deepEqual(toJson(fromJson(j).value…), j)` for the sharp fixture.
- **Gate 2 cross-format oracle**: from an XML fixture build `a = fromXML`, from the equivalent JSON build
  `b = fromJson`; assert `toXML(a) === toXML(b)` (byte-identical) AND `deepEqual(toJson(a), toJson(b))`.
- **Sharp fixture** (design §round-trip gate 3): status=0 node w/ omitted `size`/`type`; a `Label` referenced by
  id; a `Link` with forward-reference `source`/`target`; `pinned=false` + `pinned=true` links; genuinely ABSENT
  `isMany` collections asserted ABSENT in `toJson` output (never add `zone:[]` to pass); a `Zoom.offset` nested
  default; a `propertiesSet` reference; a present non-default scalar (`status=2`) asserted to SURVIVE.
- **Validator rejections** (each returns `ok:false` with the right keyword): dangling ref; duplicate id; wrong
  scalar type; misplaced `$type` (a `pfdn:Zone` in `node[]`); reference whose target type mismatches; unknown key;
  unknown `$type`; abstract `$type` (`pfdn:Base`). **id-less canonical doc PASSES** (`emptyModel`/`INITIAL_DIAGRAM`
  shape — regression witness for the R4 fix). `{lax:true}` downgrades dangling-ref to success+warning.

**`packages/core/src/model/model.test.ts`** (or the existing model test): `loadModelFromJson` on a settings-less
JSON diagram boots (`definitions.settings.zoom.offset` populated — `ensureSettings` ran) and a Viewer can `.get`;
invalid JSON string throws `PfdnValidationError`; a dangling-ref doc throws by default, `{lax:true}` loads.

Run cross-package tests after `pnpm --filter @d3-polytree/pfdn-moddle build` (core test reads built dist).

## Step 8 — Changeset
`.changeset/json-adapter-validator.md`: `@d3-polytree/pfdn-moddle` **minor** (toJson/fromJson/validate/assertValid
+ generated types), `@d3-polytree/core` **minor** (loadModelFromJson).

## Step 9 — Docs
- `README.md`: a short "JSON documents" subsection (typed + validated `toJson`/`fromJson`/`loadModelFromJson`).
- `ROADMAP.md`: mark C11 done.

## Step 10 — Full local gate (mirror CI)
`pnpm install` (no new deps) → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build` →
`pnpm build-storybook` → `node packages/pfdn-moddle/scripts/generate-pfdn.mjs && git diff --exit-code --
packages/pfdn-moddle/src/pfdn.generated.ts` (drift gate). All green before push.

## Traceability to debate findings
- F1 (exact omit predicate, raw-own read): Step 3 `toJson`.
- F2 (assignability, correct direction + baked): Step 1 `allTypesByName`, Step 3 `validate` M2/M4.
- M3 (reference target-type): Step 3 `validate` P2.
- Two-pass `fromJson`: Step 3 `fromJson`.
- R4 (id optional, no required-id): Step 1 interfaces, Step 3 `validate` uniqueness-when-present, Step 7 regression.
- M1 (unused-locals): eliminated by the table-driven realization (plan-level decision above).
- Drift gate + turbo guards: Step 6.
