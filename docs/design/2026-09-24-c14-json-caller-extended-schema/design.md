# Design: c14-json-caller-extended-schema

**Created**: 2026-09-24
**Depth**: full
**Rounds**: 2 (termination: approved)
**Approved by**: user @ 2026-09-24
**Grounded in**: recon.md

---

## Chosen Approach

Make the JSON `validate`/`buildTree` path read its schema through a small **`SchemaSource` indirection with two providers**, so the default path is byte-identical to today and caller-extended packages are supported by projecting the *live moddle descriptor* — exactly mirroring how XML's `fromXML` already reads the live model.

**`SchemaSource` interface** (`packages/pfdn-moddle/src/json.ts`) — precisely the reads the walkers perform:

```ts
interface SchemaSource {
  isConcrete(type: string): boolean;            // replaces CONCRETE_TYPES.includes  (json.ts:152)
  typeInfo(type: string): TypeInfo | undefined; // replaces SCHEMA[type]             (json.ts:160,237,277)
}
```
`TypeInfo`/`PropInfo` are reused verbatim from `pfdn.generated.ts:132-145`.

**Base provider** (used when `opts.packages` is absent) — a zero-logic, allocation-free wrapper over the committed generated tables: `{ isConcrete: t => CONCRETE_TYPES.includes(t), typeInfo: t => SCHEMA[t] }`. The default path stays provably identical to today (`json.test.ts:142-231` unchanged).

**Live provider** `liveSchema(moddle)` (used *only* when `opts.packages` is supplied) — a **strict 6-field projection** of the live moddle `$descriptor` (moddle 7.2.0 API adversary-verified): `abstract` ← `moddle.getTypeDescriptor(name)?.isAbstract`; `allTypesByName` ← `Object.keys(descriptor.allTypesByName)` (set membership only — both reads at `json.ts:161,237` are `.includes`); `properties` ← `descriptor.properties.filter(p => !p.isVirtual).map(p => ({ name, type, isMany: !!p.isMany, isReference: !!p.isReference, isId: !!p.isId, isSimple: BUILTINS.has(p.type) }))` — carrying `isId` (used at `json.ts:178,297`), skipping `isVirtual` (moddle includes them, `generate-pfdn.mjs:28` does not), and deriving `isSimple` from json.ts's 4-item `BUILTINS` (`:24`), which is *identical* to the set moddle-xml itself uses (`isSimpleType`), so the JSON element/simple decision is byte-identical to XML for every type including enums.

**Branch point** (one line in `validate` and `buildTree`): `const schema = opts.packages ? liveSchema(createPfdnModdle(opts.packages)) : baseSchema;`. `validate`/`buildTree` bodies become source-agnostic (`SCHEMA[t]` → `schema.typeInfo(t)`, `CONCRETE_TYPES.includes(t)` → `schema.isConcrete(t)`). `buildTree` swaps `new PfdnModdle({ pfdn: pfdnPackage })` (`json.ts:271`) for `createPfdnModdle(opts.packages ?? {})` (behaviorally identical on the base path), so `moddle.create(extType)` resolves and the returned tree's `$model` (`model.ts:114`) carries the extended packages.

**Additive optional signatures** (all backward-compatible): `validate(doc, { lax?, packages? })`, `fromJson(doc, { lax?, packages? })`, `assertValid(doc, { packages? })` threading into its internal `validate(doc, { packages })` (`json.ts:251`), and core `loadModelFromJson(input, { lax?, packages? })` forwarding straight to `fromJson` (`model.ts:108`). `fromJson` threads `opts.packages` into **both** `validate` and `buildTree`.

**Base-parity pin test (blocker)**: for every `SCHEMA` key and every `CONCRETE_TYPES` member, `liveSchema(createPfdnModdle())` must agree with the generated tables — `isConcrete` equal, `typeInfo(t).abstract` equal, `allTypesByName` equal **as sets** (live ancestor-first vs generated self-first; `.includes`-only reads make order immaterial), and `properties` equal as a name→PropInfo **map**. This converts the live-projection fidelity into a standing CI regression guard.

Shipped as a Changesets **minor** on `@d3-polytree/pfdn-moddle` (new `packages` option on the public JSON API) + **minor** on `@d3-polytree/core` (new `packages` option on `loadModelFromJson`).

## Rejected Alternatives

- **Base-routing: retire the generated-table path, build a moddle on every `validate()`** (Round-1) — rejected: adds a moddle build + descriptor projection to the allocation-free standalone-`validate` hot path, and *manufactures* a base-parity risk. The "two validators" cost was a mischaracterization — it is one validator body reading one of two `SchemaSource` providers.
- **Supplemental `SCHEMA`/`CONCRETE_TYPES` table merged over the base** (fork b) — rejected: invents a second authoring contract; callers already encode types in a moddle `Package` that `createPfdnModdle` consumes, so a parallel hand-written table duplicates it and can drift (`DN-7`/`DN-2`).
- **Per-caller regeneration of `pfdn.generated.ts`** — rejected: baking caller types into the committed generated file trips the CI drift gate (`PLAT-04`); XML regenerates nothing, so parity means reading the live model, not regenerating.

## Open Risks

- [ ] **`effectiveType`-refined properties** — moddle-xml's Reader classifies via `propertyDesc.effectiveType || propertyDesc.type` while the projection reads only `p.type`; a redefined/`extends`-refined prop with a distinct `effectiveType` could classify differently between XML and JSON. Absent in base `pfdn.json` (pin test unaffected); document as an extended-package limitation in the plan.
- [ ] **Import-cycle hygiene** — `json.ts` importing `createPfdnModdle` from `./index` while `index.ts` imports from `./json` is runtime-safe (lazy, inside `validate`/`buildTree`) but should be kept cycle-free (import the factory from a cycle-free module or keep the `createPfdnModdle`/`new PfdnModdle` construction local to `json.ts`). To be addressed at the implementation step.
- [ ] **Double moddle instantiation on the extended `fromJson` path** (one in `validate`, one in `buildTree`) — neutral for base, acceptable for extended; a single shared moddle is a deferred micro-optimization.

## Principles & Host Rules Touched

- `DN-9`/`DN-7` — honored by: two providers keep the base path allocation-free and confine the moddle-build cost to the extended path (where `buildTree` already builds one).
- `DN-8` (SOLID) — honored by: a single validator body reading a `SchemaSource` seam; the strict 6-field projection carries exactly what the walkers consume.
- `DN-2` (reuse) — honored by: reusing `createPfdnModdle`, the generated `TypeInfo`/`PropInfo`/`SCHEMA`/`CONCRETE_TYPES`, `BUILTINS`, and the `$model` reuse in the core loader.
- Host rule "never hand-edit generated files" / CI drift gate (`PLAT-04`, `.github/workflows/ci.yml:40-51`) — honored by: `pfdn.generated.ts` and `generate-pfdn.mjs` untouched; extended types projected live, never written to the generated file.
- Host rule "JSON additive over the *same* model as XML; parity with `fromXML`/`toXML`" (recon; `ROADMAP.md:537`) — honored by: `liveSchema` mirrors `fromXML`'s live-model read, and the element/simple decision is byte-identical to moddle-xml's (same `BUILTINS`).

## Waivers

None — the Round-2 adversary verdict was SOUND with no floor breach; all residual objections are norm-level and folded into Open Risks / the plan.
