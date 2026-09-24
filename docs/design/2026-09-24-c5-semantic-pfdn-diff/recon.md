# Recon: c5-semantic-pfdn-diff

**Created**: 2026-09-24
**Change**: A pure, fixture-testable `diff(a, b)` over the `.pfdn` moddle tree producing typed ops (added / removed / moved / retyped / reattached); later a review overlay with ghosted prior positions and a three-way helper for git conflicts (roadmap C5, `ROADMAP.md:527`). This debate scopes the **pure diff engine** first.
**Depth**: full
**Affected areas**: new `packages/diff`, consuming `packages/pfdn-moddle` model types; workspace catalog (root `README.md`, `.changeset`)

---

## Repo Profile

pnpm + Turbo monorepo; pure DOM-free packages (`layout`, `pfdn-moddle`) are the template for fixture-testable logic. `pnpm-workspace.yaml` globs `packages/*` (no per-package registration). Changesets for versioning; new package names are bootstrapped via `NPM_TOKEN` then go tokenless (root `CLAUDE.md` "Releases"). Tooling: vitest (node env for pure pkgs), tsc, eslint, prettier.

## Codebase Map

- **`packages/pfdn-moddle/src`** (model source, TS)
  - `pfdn.generated.ts` — typed docs `PfdnDiagram`/`PfdnNode`/… `:4-124`; `PfdnDocument = PfdnDiagram` `:127`; `PfdnElement` union `:130`; `SCHEMA` `:148`, `CONCRETE_TYPES` `:314`.
  - Containment (Diagram owns): `settings`, `node[]`, `link[]`, `label[]`, `zone[]`, `propertiesSet[]` (`SCHEMA['pfdn:Diagram'].properties` `:296-310`).
  - Identity: `pfdn:Base.id` is the sole `isId` prop `:156-164`; **optional** (`id?`). Id-bearing: Diagram/Node/Link/Label/Zone/Settings/PropertiesSet. `Coordinates`/`Border`/`Grid`/`Zoom`/`Property` are id-less inline value objects.
  - Op field mapping: moved → `Node.position`/`Zone.position`/`Label.position` (`pfdn:Coordinates {x,y}`), links → `waypoint: Coordinates[]` (`:107,:290`). retyped → `PfdnNode.type?` (`:69`,SCHEMA `:246`; default `"default"`). reattached (refs, `isReference`) → `Link.source`/`Link.target` (`:285-286`, `isSimple`), `Node.label`/`Node.propertiesSet` (`:245,:248`), `Zone.label` (`:268`), `Link.label`/`Link.propertiesSet` (`:284,:293`).
  - JSON front door: `toJson(element): PfdnDocument` (`json.ts:105-107`) — refs collapsed to id strings, defaults omitted, deterministic. Internal descriptor-walk pattern: `walk` (`json.ts:145-222`), `create` (`json.ts:275-304`) — **not exported**.
  - XML parse index: `ParseResult.elementsById` (`PfdnModdle.ts:20`) — filled by XML reader only.
- **`packages/layout`** (pure-package template, TS)
  - `package.json` `:1-41` (dual ESM/CJS exports, `sideEffects:false`, `build:tsup`/`typecheck`/`test:vitest run`); `tsup.config.ts`; `tsconfig.json` extends root base; **no `vitest.config.ts`** (default node env); `src/index.ts` barrel `:1-31`.
  - Tests: co-located `src/layout.test.ts` — inline factory fixtures `:5`, structural assertions, determinism `expect(layout(g)).toEqual(layout(g))` `:112-124`.
- **`packages/ssr`** — weaker template (has jsdom vitest.config `:1-8`, runtime deps); shows `workspace:*` dep pattern (`ssr/package.json:27-32`).
- Catalog: root `README.md:15-30` Packages table (`ssr` row `:29`); `docs/README-template.md` (section order `:19-21`, skeleton `:71-132`, pure-logic no-story rule `:78-79`, absolute-URL rule `:28-30`, license `MIT © David Castillo` `:131`); `.changeset/config.json:1-11`.

## Patterns to REUSE

- Pure-package scaffold → copy `packages/layout` shape (package.json/tsup/tsconfig/src barrel, no vitest.config).
- Enumeration → **do not import a live-tree walker (none is exported)**; mirror the descriptor-driven `walk`/`create` pattern (`json.ts:145-222,275-304`) or drive off `SCHEMA`/`CONCRETE_TYPES` (`pfdn.generated.ts:148,314`).
- Input form → consume `PfdnDocument` typed JSON via `toJson` (`json.ts:105`) — refs already id-strings, deterministic; not live moddle elements.
- Test style → inline before/after `PfdnDocument` literals; determinism + order-stability assertions like `layout.test.ts:112-124`.
- Catalog edits → add a root README row (mirror `:29`); README from `docs/README-template.md` skeleton; a **minor** changeset for the new package.

## Host Conventions & Hard Rules

- **Hard rule** (root `CLAUDE.md` `PLAT-04`): never hand-edit generated files (`pfdn.generated.ts`); regenerate via the generator. The diff package **consumes** generated types; it must not fork or hand-edit them.
- **Hard rule** (`d3-polytree/CLAUDE.md` "Package READMEs"): every publishable package ships a README following `docs/README-template.md`; cross-links must be **absolute `/tree/main/` GitHub URLs**; a new/changed public API needs a changeset (new package → minor).
- **Hard rule** (`d3-polytree/CLAUDE.md` "How to Act" #1): "**Don't assume — ask, and surface tradeoffs.** On ambiguity or a design fork, stop and raise it." → the "reattached" semantics fork and the dependency fork must be decided at a gate, not silently.
- **Hard rule** (`d3-polytree/CLAUDE.md` #2/#3): "Write the minimum that solves the stated problem"; "keep diffs surgical" — YAGNI on the diff engine (no speculative merge/overlay machinery in the pure-engine step).
- Convention: pure packages use the node vitest env; `sideEffects:false`; strict TS (`tsconfig.base.json`).

## Dependencies

- Data / schema: the `.pfdn` moddle model (read-only); the typed `PfdnDocument` shape.
- External contracts: a **new** public package `@d3-polytree/diff` with an exported `diff()` + op/result types — its API is greenfield and load-bearing (consumers depend on the op shape).
- Config / environment: workspace auto-includes `packages/*`; a new package needs a root README row + changeset; first publish bootstraps via `NPM_TOKEN`.
- Cross-area edges: `diff` → (optionally) `@d3-polytree/pfdn-moddle` for `PfdnDocument`/`SCHEMA` types.

## Risks / Not-found

- **Design fork A — "reattached" semantics**: stored-reference changes (`Link.source/target`, `Node.label`, etc.) are read directly; **zone membership / reparenting is NOT a stored field** — it is geometric (node `position` inside a zone box). Decide: report refs only, or also derive geometric membership. (Raise at gate — CLAUDE.md #1.)
- **Design fork B — packaging dependency**: depend on `@d3-polytree/pfdn-moddle` (reuse `PfdnDocument`/`SCHEMA`, `DN-2`) vs. keep truly zero-dep with structural type-only inputs.
- **Design fork C — input form**: diff `PfdnDocument` JSON (deterministic, refs-as-ids) vs. live moddle elements (needs traversal). Recon recommends JSON.
- Id-less elements (`Coordinates`, `Property`, …) cannot be identity-matched — diffed structurally within their owner.
- Optional ids: elements may lack an `id` (minted at render). A diff over author-time documents must define matching when ids are absent (Not found: any stable non-id key — likely out of scope; require ids or match positionally).
- Not found: any existing diff/merge code — greenfield.

## Recommended Scope

A new pure package `@d3-polytree/diff` exporting `diff(a: PfdnDocument, b: PfdnDocument): DiffOp[]` producing typed ops (added/removed/moved/retyped/reattached), deterministic and order-stable, fixture-tested, DOM-free — modeled on `packages/layout`. Scope the review overlay + three-way helper as follow-ups (YAGNI for this step). Decide forks A/B/C at the debate gate before coding.
