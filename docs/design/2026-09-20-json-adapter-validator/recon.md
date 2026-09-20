# Recon: json-adapter-validator

**Created**: 2026-09-20
**Change**: C11 — an additive JSON path over the SAME moddle model (moddle element ↔ plain JSON document), plus a runtime validator + typed document generated from `pfdn.json`, so consumers get typed, validated documents without touching XML (roadmap O1 left this open).
**Depth**: deep
**Affected areas**: `packages/pfdn-moddle` (the model + schema + codegen), `packages/core/src/model` (a JSON load path mirroring `loadModel`).

---

## Repo Profile

pnpm 10 + Turborepo monorepo of `@d3-polytree/*` TS/ESM packages (strict). Per-package tsup (ESM+CJS+dts); Vitest (jsdom, but pfdn-moddle is pure — no DOM); Changesets. Codegen precedent: `icons-amazon` emits a committed `src/*.generated.ts` via a Node stdlib script, with `build = "node scripts/… && tsup"` and turbo `^build` ordering. `pfdn.json` is consumed as a JSON-module import (`resolveJsonModule` per-package), bundled inline by tsup.

## Codebase Map

- **`packages/pfdn-moddle`** (pure TS; deps `moddle` ^7, `moddle-xml` ^11)
  - `createPfdnModdle` factory + JSON import: `src/index.ts:1,13` (`import pfdnPackage from './pfdn.json'`)
  - `PfdnModdle extends Moddle`: `src/PfdnModdle.ts:32`; `fromXML(xml, 'pfdn:Diagram', opts): Promise<ParseResult>` — `:47`; `toXML(element, opts): string` (sync) — `:57`
  - Public types: `ModelElement { $type; id?; [key]: unknown }` — `PfdnModdle.ts:9`; `ParseResult { rootElement, references, warnings, elementsById }`
  - Ambient moddle types: `src/moddle.d.ts` (does NOT declare `$instanceOf`/`$descriptor`/`get`/`set`, which exist at runtime)
  - Schema `src/pfdn.json` (the generation source) — see below
  - Test harness: `src/pfdn-moddle.test.ts` (create/defaults `:5-16`, XML round-trip `:18-37`, default omission `:39-48`, ref round-trip `:50-66`)
  - `exports`: single `.` subpath — `package.json:11-17`; `build: "tsup"`, deps moddle/moddle-xml — `:18,28-30`
  - tsconfig: `resolveJsonModule: true` (`tsconfig.json:6`); base is `strict`, no `noUncheckedIndexedAccess`
- **`packages/icons-amazon`** — codegen template: `scripts/generate-icons.mjs` (`readFileSync`→`writeFileSync` a committed `src/icons.generated.ts`, banner "AUTO-GENERATED … do not edit"); `package.json` `build: "node scripts/generate-icons.mjs && tsup"`, `generate` script.
- **`packages/core/src/model/model.ts`** — `loadModel(xml): Promise<ModelHost>` = `createPfdnModdle()` + `fromXML` + `ensureSettings` + `routeLinks` — `:54-64`; `emptyModel()`; `ModelHost { definitions, moddle }`. Consumers: `viewer/index.ts:71`, `ssr/index.ts:58` (`await loadModel(xml)`).

## Moddle element shape (what the JSON must represent)

- A moddle element is a **plain JS object**: `$type` (enumerable), `$instanceOf`/`$descriptor` (non-enumerable), plus enumerable property keys; `get(name)`/`set(name,value)` delegate to the descriptor (moddle `index.esm.js:6-13,51`).
- **Attributes and children are indistinguishable in JS** — both are plain keys; `isMany` children are arrays. Only the `$descriptor` (from the schema) says which is `isAttr` vs child vs reference.
- **References are stored in-memory as the RESOLVED OBJECT**, not the id string (`Node.label`, `Node.propertiesSet`, `Link.source`/`target`/`label`/`propertiesSet` — all `isReference`). moddle-xml resolves ids → objects on read (`moddle-xml/dist/index.js:783`) and collapses object → `value.id` on write (`:1591`). **A JSON adapter must do the same collapse/resolve** (emit ids, re-link on parse) or it will serialize cyclic/duplicated objects.
- Defaults: applied on `create` only for non-`isMany` props with a `default` (moddle `index.esm.js:37`); moddle-xml **omits** default-valued attrs on write (verified in C4).

## pfdn.json schema (the codegen source)

- Envelope: `prefix: "pfdn"`, `uri: "http://pfdn"`, `xml.tagAlias: "lowerCase"` — `pfdn.json:1-3,465-468`.
- Abstract mixins: `Statusable` (`status` Real isAttr default 0) `:6-17`; `Base` (superClass Statusable) adds `id` (String isAttr **isId**) + `name` (String isAttr) `:18-37`. Every concrete diagram element extends `Base`.
- Property kinds present (the validator/types must cover all): attr `String`/`Real`/`Boolean` with/without `default`; `isReference` IDREF single (`Node.label` `:233-238`; `Link.source`/`target` type String `:352-363`); `isMany` child arrays (`Link.waypoint` `Coordinates` `:382-389`; `PropertiesSet.property` `:75-83`; `Diagram.node`/`link`/`label`/`zone` `:410-463`); single child objects (`Node.position` `Coordinates` `:256-262`; `Settings.zoom`/`grid`; `Label.text` String non-attr = element body); complex default object (`Zoom.offset` `:107-119`).
- Concrete types: Property, PropertiesSet, Coordinates, Zoom, Grid, Settings, Label, Node, Border, Zone, Link, Diagram.

## Patterns to REUSE

- **The `icons-amazon` codegen shape** (`scripts/generate-*.mjs` → committed `src/*.generated.ts`; `build = node script && tsup`; turbo `^build`) — mirror as `generate-validator.mjs` (DN-2).
- **`pfdn.json` as the single schema source** already imported (`index.ts:1`) — the adapter + generator read the same schema; do not duplicate the type list.
- **`createPfdnModdle`/`moddle.create`** to build the model on JSON parse (reuse ref resolution + defaults), and the descriptor (`$descriptor`) to drive the moddle→JSON walk — don't hand-maintain a parallel type map.
- **The XML load path `loadModel`** (`model.ts:54`) — a JSON load path mirrors it (`loadModelFromJson`), reusing `ensureSettings` + `routeLinks`.
- **The round-trip test harness** `pfdn-moddle.test.ts` — extend with JSON round-trip + validator cases.

## Host Conventions & Hard Rules

- **Hard rule** (pfdn-moddle deps): "Depends on `moddle` + `moddle-xml` only; no D3." — `packages/pfdn-moddle/CLAUDE.md`. Adding a heavy validation dep (e.g. ajv) would breach the package's minimal-dep posture → prefer a dependency-free generated validator.
- **Hard rule** (Node.label IDREF): "**`Node.label` is an IDREF** (`isReference`), not a string. Assigning a raw string does not serialize correctly — pass the actual `pfdn:Label` object" — `packages/pfdn-moddle/CLAUDE.md`. The JSON parse must re-link ids to objects.
- **Hard rule** (icons generated file): "`src/icons.generated.ts` is written by `scripts/generate-icons.mjs` … do not edit it by hand." — `packages/icons-amazon/CLAUDE.md` (the convention the generated validator follows).
- Convention: `strict` TS; per-package `resolveJsonModule`; UMD only for the three components (pfdn-moddle ships no UMD).

## Dependencies

- Data / schema: `pfdn.json` (the codegen source). The JSON document is a NEW public contract (its shape + the validator's contract).
- External contracts: new public API on `@d3-polytree/pfdn-moddle` (JSON adapter `toJson`/`fromJson`, validator, generated types) + possibly `loadModelFromJson` on `@d3-polytree/core`. New export subpath(s) or main-entry additions.
- Config / environment: none.
- Cross-area edges: pfdn-moddle (adapter+validator) → core (JSON load path) → viewer/ssr (unchanged; they take a ModelHost).

## Risks / Not-found

- **Greenfield**: no ajv, no `toJSON`/`fromJSON`, no runtime validation anywhere. C11 builds the moddle↔JSON conversion and the generated validator from scratch.
- **Reference handling** is the sharp edge: in-memory refs are resolved objects; JSON must emit id strings and re-link on parse (else cycles/duplication). Unresolved refs on parse (dangling id) need a defined behavior (validator error vs moddle's lax warning-and-drop).
- **Defaults in JSON**: decide whether the JSON emits default-valued props (verbose, explicit) or omits them (like XML → smaller, and round-trip-stable against `create`'s default application). Affects round-trip equivalence.
- **Validator strategy** (the main fork): a runtime validator generated from `pfdn.json` — dependency-free hand-emitted TS functions vs emitting a JSON Schema (+ a validator lib) vs ajv. The package's minimal-dep rule pushes toward dependency-free generated functions.
- **Typed documents**: "typed" implies generated TS interfaces for the JSON shape (PfdnDocument, PfdnNode, …) from `pfdn.json` — another codegen output. Decide whether to generate types + validator together.
- **`noUncheckedIndexedAccess` absent**: the generated validator must still be strict-clean.
- **Ledger trap (typed-event-bus)**: shared types across packages must be plain exported interfaces at the sink (here pfdn-moddle is the sink), not `declare module` augmentation (dropped by the dts bundler). Relevant for the generated document types.

## Recommended Scope

Add, inside `@d3-polytree/pfdn-moddle`: (1) a **JSON adapter** — `toJson(modelElement)` (walk the `$descriptor`, emit attrs+children as plain keys, collapse `isReference` to id strings, decide defaults policy) and `fromJson(json)` (recursively `moddle.create`, re-link references by id) — pure, over the same model; (2) a **generated, dependency-free validator + typed document** emitted from `pfdn.json` by a `generate-validator.mjs` (icons-amazon pattern), committed as `src/*.generated.ts`, with `build = node script && tsup`; (3) new export subpath(s) or main-entry exports. Add a **`loadModelFromJson`** in `@d3-polytree/core` mirroring `loadModel` (reuse `ensureSettings`/`routeLinks`). Extend the round-trip test harness. Decide in the debate: the JSON shape (natural tree, refs as ids) and defaults policy; the validator strategy (dependency-free generated functions strongly preferred by the package's no-extra-deps rule); whether/how to generate typed document interfaces; and where the API lives (subpath vs main entry).
