# Design: c5-semantic-pfdn-diff

**Created**: 2026-09-24
**Depth**: full
**Rounds**: 3 (termination: approved)
**Approved by**: user @ 2026-09-24
**Grounded in**: recon.md

---

## Chosen Approach

A new **pure, dependency-light package `@d3-polytree/diff`** exporting one function, `diff(a: PfdnDocument, b: PfdnDocument): DiffOp[]` — a DOM-free, moddle-free structural diff over two `toJson`-canonical `.pfdn` documents, producing a deterministic, totally-ordered list of typed ops. The review overlay and three-way merge helper (roadmap C5) are deferred follow-ups; this ships the pure engine they depend on.

**Input contract.** Both arguments are `toJson`-canonical `PfdnDocument`s (`packages/pfdn-moddle/src/json.ts`): references are collapsed to id-strings (`json.ts:90,93`) and moddle defaults are omitted (`json.ts:6`). Both real producers (`toJson`, `fromXML`→`toJson`) satisfy this. The engine does no default injection.

**Frozen public op union (6 ops):**

```ts
export type CollectionKind = 'Node' | 'Link' | 'Zone' | 'Label' | 'PropertiesSet';
export type DiffKind = CollectionKind | 'Diagram';
export interface Coord { x?: number; y?: number }

export type DiffOp =
  | { op: 'added';      kind: CollectionKind; id: string }
  | { op: 'removed';    kind: CollectionKind; id: string }
  | { op: 'moved';      kind: 'Node' | 'Zone' | 'Label'; id: string; from?: Coord; to?: Coord }
  | { op: 'retyped';    kind: 'Node'; id: string; from?: string; to?: string }        // Node.type
  | { op: 'reattached'; kind: 'Link'; id: string;
      from: { source?: string; target?: string };
      to:   { source?: string; target?: string } }
  | { op: 'modified';   kind: DiffKind; id: string; field: string; from?: unknown; to?: unknown };
```

`modified` is the completeness op: it covers every changed leaf not owned by a structural op — scalars, the five single-*reference* leaves (`Node.label`/`Node.propertiesSet`, `Zone.label`, `Link.label`/`Link.propertiesSet`, all `isReference:true, isSimple:false`, collapsed to id-strings by `toJson`), the **Diagram root scalars** `status`/`name` (`kind:'Diagram'`, id = diagram id), and the **pinned-link waypoint** case (`field:'waypoint'`, `from`/`to` typed `Coord[]`). `import type { PfdnDocument }` is a **named** import from `@d3-polytree/pfdn-moddle`.

**Element identity + matching.** Elements are matched by `id` (`pfdn:Base.id`, the sole `isId`, `pfdn.generated.ts:156-164`) within their typed collection across the five id-keyed Diagram collections (`node`/`link`/`zone`/`label`/`propertiesSet`, `pfdn.generated.ts:304-308`); union-of-ids → `added` (b-only) / `removed` (a-only) / compared (both). A missing id on a collection member, or a root-id mismatch, is a fail-fast `DiffError` (single-root assumed). `settings`/`Zoom`/`Grid` are **scoped out** (viewport/presentation chrome; a future `kind:'Settings'` op is additive/non-breaking and, when built, must split ephemeral zoom out from persistent `backgroundColor`/`grid`).

**Carve-outs (no double-emit).** The SCHEMA-driven `modified` walk excludes fields owned by structural ops (plus any `isId` field):
```ts
const MODIFIED_CARVE_OUTS: Record<DiffKind, readonly string[]> = {
  Node: ['type', 'position'], Zone: ['position'], Label: ['position'],
  Link: ['source', 'target', 'waypoint'], PropertiesSet: [],
  Diagram: ['settings', 'node', 'link', 'label', 'zone', 'propertiesSet'],
};
```
`border` (Zone) and `pinned` (Link, Boolean) are **not** carved — they stay in the generic `modified` walk. `waypoint` is carved from the generic walk and routed to a pinned-only comparator (unpinned → skipped as C4 layout output; pinned → `modified{field:'waypoint'}`).

**Determinism.** Scalar equality is NaN-safe (`a === b || (Number.isNaN(a) && Number.isNaN(b))`); value objects (`Coordinates`, `Border`, `property[]`, `waypoint[]`) use a structural `deepEq` bottoming out in that scalar `eq` (Coordinates x/y are `Real`, `pfdn.generated.ts:188-189`). Emission order is total: Diagram-root ops first, then collections in fixed order `[Node, Link, Zone, Label, PropertiesSet]`, elements within a collection sorted by id ascending; per surviving element `retyped → reattached → moved → modified{waypoint} → modified` (remaining leaves in SCHEMA property-declaration order). No `Set`/`Map` iteration-order, `Math.random`, or `Date` reliance.

**Schema driver.** The `modified` walk imports the runtime `SCHEMA`/`CONCRETE_TYPES` from a **new curated `@d3-polytree/pfdn-moddle/schema` subpath** — `src/schema.ts` re-exports them from the pure, import-free `pfdn.generated.ts` (zero moddle at runtime), a 2nd tsup entry + a `./schema` `exports` block (the `./worker` precedent, `layout/tsup.config.ts:6`, `layout/package.json:17-21`). This drives enumeration/classification off the single generated source of truth, killing any inlined-descriptor drift.

**Packaging.** `@d3-polytree/diff` scaffolded from the `packages/layout` pure-package template (dual ESM/CJS, `sideEffects:false`, no `vitest.config`), with `@d3-polytree/pfdn-moddle` a **real** `dependency` (`workspace:*`) — the runtime `SCHEMA` import — plus a template-compliant README. Two changesets: `@d3-polytree/diff` **minor** (→ 0.1.0), `@d3-polytree/pfdn-moddle` **minor** (new `./schema` entry point). A root README table row.

## Rejected Alternatives

- **5-op union (no generic `modified`)** — rejected: a closed TS union cannot gain a member post-publish without a breaking major, and a merge helper on a diff that silently drops `name`/`size`/color/`Property`/pinned-`waypoint` changes loses edits (`DN-9`).
- **Geometric zone-membership "reattached"** — rejected: the model has no parent pointer (`PfdnNode`/`PfdnZone` carry no membership field); deriving it would invent semantics (`DF-1`). `reattached` = `Link.source`/`target` only.
- **Inlined descriptor / hand-copied field lists** — rejected: re-duplicates the drift-gated `SCHEMA` (`DN-2`); the `/schema` subpath reuses the generated source.
- **`devDependency` + `import type` only** — rejected: a pfdn-moddle type in the public `.d.ts` dangles under a devDependency (consumer TS2307); it must be a real `dependency` (and the runtime `SCHEMA` import requires it anyway).
- **Live moddle-tree input** — rejected: stores refs non-enumerably and defaults on the prototype, forcing a moddle runtime dep; `toJson` JSON is canonical and pure.

## Open Risks

- [ ] **`toJson` default-omission blind spot** — a change between "field absent" and "field explicitly set to its default value" canonicalizes identically and is undetectable. Unreachable for contract (canonical) inputs; documented as a `diff()` contract limitation.
- [ ] **Positional addressing of id-less `property[]`/`waypoint[]`** — a reorder emits `modified` even when the set is unchanged. Documented in the contract.
- [ ] **Settings scope-out** — `backgroundColor`/`grid`/`zoom` changes are invisible; the future `kind:'Settings'` op (additive) must split ephemeral zoom from persistent styling.

## Principles & Host Rules Touched

- `DN-9` (staff-engineer) — honored by: the generic `modified` op ships at v0.1.0 so the public type is future-proof for the merge helper; settings scope-out is a recorded, non-breaking-to-extend trade-off.
- `DN-7` (YAGNI) — honored by: only the pure `diff()` engine ships; overlay/three-way deferred; union kept at 6 ops (pinned waypoint reuses `modified`).
- `DN-2` (reuse) — honored by: the `layout` scaffold, the generated `PfdnDocument` types + `SCHEMA`/`CONCRETE_TYPES` via `/schema`, and the `toJson` canonical form.
- Host rule "never hand-edit generated files" (`PLAT-04`) / drift gate — honored by: `src/schema.ts` re-exports *from* `pfdn.generated.ts`; the generated file and generator are untouched.
- Host rule "every publishable package ships a template README; absolute `/tree/main/` URLs; new package → changeset" (`d3-polytree/CLAUDE.md`) — honored by: `packages/diff/README.md` from the skeleton + minor changesets + root README row.
- Host rule "surface design forks at a gate" (`d3-polytree/CLAUDE.md` #1) — honored by: forks A/B/C and the settings scope-out were decided at the debate gates.

## Waivers

None — the Round-3 adversary verdict was SOUND with no floor breach; residual objections are norm-level (documented scope-out + a named-import fix) and folded into Open Risks / the plan.
