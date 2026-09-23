# Design: json-adapter-validator (C11)

**Created**: 2026-09-20
**Depth**: deep — 3-proposer panel (minimal-delta / target-state / operational-safety) + 5 adversary
rounds. Verdicts: R1 SOUND-WITH-FIXES (2 major), R2 SOUND-WITH-FIXES (1 major), R3 SOUND-WITH-FIXES
(minor), R4 SOUND-WITH-FIXES (1 major), **R5 SOUND (clean)**. Approved at the R5 gate.
**Change**: an additive JSON path over the SAME moddle model — `toJson`/`fromJson`
(moddle element ↔ plain JSON document), a dependency-free validator + typed `PfdnDocument` interfaces
generated from `pfdn.json`, and `loadModelFromJson` in `@d3-polytree/core`. Roadmap O1.
**Affected**: `packages/pfdn-moddle` (adapter + generator + generated file + exports),
`packages/core/src/model` (JSON load path), `.github/workflows/ci.yml` (drift gate).

---

## Problem

The `.pfdn` model is only reachable as XML today (`fromXML`/`toXML`, `PfdnModdle.ts:47,57`). O1 left a
typed, validated JSON path open: consumers want to produce/consume documents as plain JSON — typed at
compile time and validated at runtime — without hand-writing XML. This must be strictly additive: today's
XML consumers pay nothing.

## Ground truth (verified in the moddle/moddle-xml runtime during recon + debate)

The moddle element is a **hostile object to serialize naively**:

- **References are stored NON-ENUMERABLE** (`moddle/dist/index.esm.js:765`, `enumerable: !property.isReference`).
  `JSON.stringify`/`Object.keys`/spread silently drops every `label`/`source`/`target`/`propertiesSet`.
- **Defaults live on the PROTOTYPE**, applied at `create` for non-`isMany` props with a `default`
  (`index.esm.js:37-40`); `get()` returns the inherited default even when unset, and **materializes an unset
  `isMany` prop as an own `[]`** on access (`:671-677`).
- moddle-xml collapses ref→`value.id` on write, resolves id→object on read; its writer
  (`getSerializableProperties`, `moddle-xml/dist/index.js:1095-1124`) omits a prop unless
  `hasOwnProperty && value !== default && value !== null && (isMany ? value.length : true)`, and skips `isVirtual`.
- **dts-drop trap**: `declare module` blocks never reach the built `dist/index.d.ts` (proven: `moddle.d.ts`
  absent from dist). Shared/generated types must be **plain exported interfaces** in the `index.ts` import graph.
- `tsconfig.base.json`: `strict`, `verbatimModuleSyntax:true` (type-only re-exports need `export type`),
  `noUnusedLocals`/`noUnusedParameters` ON, `noUncheckedIndexedAccess` ABSENT, `exactOptionalPropertyTypes` absent.
- `isId` means "if present, this is the identifier" — it is **NOT** a presence constraint; the engine routinely
  emits id-less `isId` elements (`emptyModel()` Diagram `model.ts:49`, `ensureSettings()` Settings `:25`, the
  canonical `INITIAL_DIAGRAM` root+settings `editor/src/index.ts:47-48`).

## Approach

### 1. JSON shape + defaults (adapter, pure)

Descriptor-driven walk of `element.$descriptor.properties`; read the **raw own value `element[p.name]`**, NOT
`element.get()` (which materializes unset collections and defeats the omit gate). Per property, in ORDER:

1. `isReference` → the referent's **`id` string** (re-linked on parse). Tested FIRST — `Node/Zone/Link.label`
   (type `Label`) and `Node/Link.propertiesSet` (type `PropertiesSet`) are _complex-typed_ references; an
   `isSimpleType`-first split would walk the referent (cycle/duplication).
2. `isSimpleType(p.type)` → scalar key (so `Label.text`, a nested simple element with no `isBody`, → a plain
   `text` string).
3. else → nested object, or array when `isMany`.

Every element object carries **`$type`** (`"pfdn:Node"`) — the schema advertises `xsi:type` polymorphism
headroom on nearly every child property; self-describing + 1:1 with moddle; ergonomics recovered by the
generated `$type`-literal interfaces. **Defaults are OMITTED** using the exact `getSerializableProperties`
predicate above (the `!== null` and `isMany ? value.length` clauses are load-bearing). Round-trip-stable because
`moddle.create` re-applies defaults.

### 2. `fromJson` — validate-first, two-pass rebuild (pure)

`fromJson(doc, {lax?}): Result<ModelElement, ValidationError[]>`. **Validate the plain JSON FIRST**, then build —
mandatory, because moddle's lax setter deletes dangling refs and shoves unknown keys into `$attrs`
(`index.esm.js:648`) before a build-then-validate check could see them. Build is **two passes** mirroring
moddle-xml `resolveReferences` (`index.js:741-785`): **Pass 1** recursively `moddle.create($type, {…})` every
element WITHOUT its `isReference` props, building a global **id→object index** over all `isId` types; **Pass 2**
resolves each single reference id → object and stores it via the moddle **setter** so it lands non-enumerable.
pfdn has **zero `isMany` references** (all `isMany` props are containment), so only the single-ref branch is
needed. `moddle.create` does NOT recurse into plain objects, so every sub-element is `create`d individually and
assembled. `fromJson` **internally `createPfdnModdle()`** (the registry is derived from the static `pfdn.json`,
stateless; per-call instance is correct and harmless).

### 3. Validator — dependency-free, generated, strict, collect-all

Generated dependency-free TS from `pfdn.json` (ajv/JSON-Schema-runtime rejected by the package's hard
"moddle + moddle-xml only" rule). Returns `Result<T, ValidationError[]>` with a JSON-Pointer `instancePath`,
collecting ALL errors. Pure — the `$type`-assignability and reference-target-type checks use generator-**baked**
`allTypesByName` tables (not `getType`/`hasType`), so no moddle instance is needed. Checks:

- known **concrete** `$type` (abstract `Base`/`Statusable` excluded — `moddle.create` does not gate on
  `isAbstract`, so building one yields junk);
- **`$type` assignable to the containing property's declared type** — correct IS-A direction
  `getType(child.$type).hasType(property.type)`, baked as a table (monomorphic today → `child.$type ===
property.type`, but future subtypes work on regen);
- **resolved referent's type** matches `property.type` (reference-side twin of the containment check);
- primitive type match (`String`→string, `Real`→number, `Boolean`→boolean); `isMany` → array;
- **id uniqueness WHEN PRESENT** (NOT required-id — that would reject the engine's own canonical id-less docs);
- **references resolvable** (hard error by default; opt-in `lax` downgrades to collected warning+drop);
- **unknown keys / unknown `$type` rejected** (strict).
- NO enum/range checks (schema declares none). `$attrs`/extension attributes are explicitly out of scope
  (a descriptor-only walk can't see them; JSON is deliberately less forward-compatible than XML here).

Generated code must pass `tsc --noEmit` under the full base tsconfig: explicit `typeof`/`Array.isArray`/`in`
guards (no `noUncheckedIndexedAccess`), and **zero unused locals/params**.

### 4. Typed documents — co-generated, plain interfaces, drift-gated

One `scripts/generate-pfdn.mjs` (icons-amazon pattern) → one committed `src/pfdn.generated.ts` (validator +
interfaces), "do-not-edit" banner, deterministic (stable ordering, no timestamps, LF). Interfaces match
`toJson`'s runtime output EXACTLY: **`$type` required** (literal), **`id?: string` optional** on every
`Base`-derived type, refs `string`, **defaulted props optional**. `PfdnDocument` = `pfdn:Diagram` root; a
`PfdnElement` `$type`-keyed union for heterogeneous walkers. Plain `export interface`/`export type` in the
`index.ts` import graph — never `declare module`; verify by grepping the BUILT `dist/index.d.ts`. Optional
branded `ValidatedPfdnDocument` + `assertValid(doc): asserts doc is ValidatedPfdnDocument` for consumers wanting
compile-time proof (not forced through `fromJson`/`loadModelFromJson`).

**CI drift gate (new — no such step today)**: after Build (which regenerates via
`build: "node scripts/generate-pfdn.mjs && tsup"`), run `git diff --exit-code -- packages/pfdn-moddle/src/pfdn.generated.ts`.
Turbo guards: `build.outputs` stays `dist/**` (never the generated source); if `.turbo`/remote caching is ever
enabled, the drift step must run the generator itself.

### 5. API placement + core integration

Export `toJson`/`fromJson`/`validate`/`assertValid`, the new types `Result`/`ValidationError`/
`PfdnValidationError`, and the generated document types from the existing single `.` entry (no new subpath;
tree-shaking preserved by `sideEffects:false`; verified no name collision with current exports). Additive
**minor** bump to `@d3-polytree/pfdn-moddle` and `@d3-polytree/core`.

`loadModelFromJson(input: string | PfdnDocument, {lax?}): Promise<ModelHost>` beside `loadModel`
(`core/src/model/model.ts`, auto-exported via `core/src/index.ts:36`). Accepts a string (wraps `JSON.parse`,
converts `SyntaxError` into the same error channel) or object → validate → two-pass build →
**`ensureSettings`** (load-bearing: a settings-less doc throws at DI injection; JSON is MORE likely to omit
settings) → **`routeLinks`** (identical to the XML path; a non-pinned link's authored waypoints are recomputed
just as `loadModel` does — matched behavior, `pinned` read via prototype default). **Error contract: strict by
default, THROWS an aggregated `PfdnValidationError`** on validation failure — a deliberate, loudly-documented
divergence from `loadModel`'s XML lax-tolerance (`PfdnModdle.ts:52` `lax:true`; warnings discarded at
`model.ts:56`), because a JSON document is a new external contract where silent corruption is the worse failure.
`{ lax: true }` restores `loadModel`-matching tolerance. Viewer/ssr unchanged (they consume `ModelHost` via
`loadModel(xml)`; `loadModelFromJson` has no existing callers).

## Round-trip equivalence (test contract — three gates)

1. **JSON idempotence**: `deepEqual(toJson(fromJson(j)), j)`.
2. **Cross-format oracle**: build the same model via `fromXML(xml)` and `fromJson(json)`; assert
   `toXML(a) === toXML(b)` (reuse the proven byte-identical XML gate) AND `deepEqual(toJson(a), toJson(b))`.
   (`Real` float formatting is symmetric across the same Writer, so no `2` vs `2.0` divergence — verified R5.)
3. **Sharp fixture** (defeats happy-path masking, per the ledger status-lesson): a **`status="0"` node with
   omitted defaults (no `size`, no `type`)**, a `pfdn:Label` referenced by id, a `Link` with **forward-reference**
   `source`/`target`, one `pinned=false` (default) + one `pinned=true` link, genuinely **absent** `isMany`
   collections asserted ABSENT from output (never add `zone:[]` to pass the test — fix the predicate), a nested
   default object (`Zoom.offset`), a `propertiesSet` reference, and at least one **present non-default scalar**
   (e.g. `status=2`) asserted to SURVIVE.

## Rejected alternatives

- **ajv / JSON-Schema runtime validator** — breaches the package's hard minimal-dep rule.
- **Emit a JSON Schema artifact now** (target-state's `./schema`) — DEFERRED: faithfully expressing
  IDREF/default-omission/body-text/`xsi:type` in Draft 2020-12 is the single most fragile piece ("a subtly-wrong
  schema is worse than none"); ship the dep-free enforcer first, add the schema additively later.
- **`$type`-less keyed tree** (minimal-delta) — rejected for durability: the schema's `xsi:type` polymorphism
  headroom makes a self-describing `$type` worth ~a few bytes/element.
- **New `./json` subpath** — rejected as needless surface; `sideEffects:false` preserves tree-shaking on `.`.
- **Required-`id` validation** — rejected: rejects the toolkit's own canonical id-less documents (R4).
- **Build-then-validate** — rejected: moddle's lax setter mutates/loses data before the check runs.

## Open risks

- **Generator fragility**: emitting strict-clean TS (no unused locals/params, no `noUncheckedIndexedAccess`) is
  fiddly; mitigated by the round-trip gates + the CI drift gate + `tsc --noEmit` in CI.
- **JSON-Schema deferral**: consumers wanting a machine-readable schema get the dep-free validator now; the
  schema is a documented follow-up.
- **Strict-throw divergence** from `loadModel`: mitigated by loud JSDoc/doc + `{lax}` opt-in; no existing caller
  affected.

## Ledger lesson (append)

See `docs/design/ledger.md` — a naive moddle→JSON serializer silently drops non-enumerable references and
prototype defaults; the adapter must be `$descriptor`-driven, read raw own values (not `get()`), and mirror
moddle-xml's exact writer predicate — proven only by a status=0 / omitted-default / forward-reference fixture and
the byte-identical `toXML` cross-format oracle.
