# @d3-polytree/pfdn-moddle — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the `.pfdn`
moddle model — schema traps, IO asymmetries, and the round-trip contract into core. Does not restate
the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/pfdn-moddle**.

## Rules (`MODDLE-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **MODDLE-01** | **XML ingestion is lax by default; JSON ingestion is strict by default.** `fromXML` hard-codes `lax: true` (unknown/unresolvable XML tolerated); `validate`/`fromJson` reject the same unless `{ lax: true }`. | The two entry paths deliberately differ; don't assume parity, and don't "fix" `fromXML` to strict — it breaks legacy `.pfdn` tolerance. | `packages/pfdn-moddle/src/PfdnModdle.ts#fromXML`, `packages/pfdn-moddle/src/json.ts#validate` | `packages/pfdn-moddle/src/json.ts#validate` |
| **MODDLE-02** | `label`, `propertiesSet`, `source`, `target` are **IDREFs** (`isReference` + `isAttr`) on Node/Zone/Link — assign the actual element (moddle re-links on read) or the id attr, never a raw string/object. | Only `Node.label` is called out in the package `CLAUDE.md`; assigning a raw value to `Zone.label`/`Link.label` won't serialize. `toJson` collapses these to id strings; `fromJson` re-links two-pass. | `packages/pfdn-moddle/src/pfdn.json#Node`, `#Zone`, `#Link`, `packages/pfdn-moddle/src/json.ts#buildTree` | `packages/pfdn-moddle/src/pfdn.json#Link` |
| **MODDLE-03** | Every non-attr complex property carries `xml.serialize: "xsi:type"`. A new complex/child property **without** it serializes with a different element shape and breaks round-trip parity with existing documents. | Matches the on-disk `.pfdn` element shape. | `packages/pfdn-moddle/src/pfdn.json` (`Node.position`, `Link.waypoint`, `Zone.border`, `Diagram.node/link/…` — N≥10) | `packages/pfdn-moddle/src/pfdn.json#Node` (`position`) |
| **MODDLE-04** | `toJson` must **byte-mirror moddle-xml's writer predicate** (own / non-default / non-null / non-empty; read *raw own values*, never `element.get`). The cross-format oracle test asserts `toXML(fromJson(toJson(x)))` is byte-identical to `toXML(x)`. | If the predicate drifts from moddle-xml's (or a `moddle-xml` upgrade changes writer semantics), round-trip diverges silently — no crash. `library: moddle-xml`. | `packages/pfdn-moddle/src/json.ts#toJsonElement`, `packages/pfdn-moddle/src/json.test.ts` ("gate 2") | `packages/pfdn-moddle/src/json.ts#toJsonElement` |

## Norms (`MODDLE-*`) — defaults & asymmetry guidance

| ID | Norm | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **MODDLE-N05** | `pfdn:Coordinates`, `pfdn:Grid`, `pfdn:Border` extend nothing and have **no `status`** (pure value objects), unlike the 9 `Statusable` types. Code reading `element.status` generically gets `undefined` on these three. | An `element.status`-based branch must guard these value objects. | `packages/pfdn-moddle/src/pfdn.json#Coordinates`, `#Grid`, `#Border`, `packages/pfdn-moddle/src/pfdn.generated.ts#SCHEMA` | `packages/pfdn-moddle/src/pfdn.json#Coordinates` |

## Gotchas & scars

- **Property *ordering* in the meta-model is significant** (imported bpmn-moddle lineage; a historical `fix(meta-model): revert activity props naming + reorder process props`, commit `49bf7b7`). Reordering schema properties can change serialization — treat `pfdn.json` property order as load-bearing.

## Candidate rules (unverified)

| Candidate | Why suspected | What would confirm it |
|---|---|---|
| `validate` never checks a simple-typed IDREF's *target type* (a `Link.source` pointing at a Label id passes) | intentional per `json.test.ts` "accepts String-typed IDREFs", but may be undesired | maintainer confirms whether target-type checking is wanted |

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| `Node.label` is an IDREF; `Node.size` default 25, `type` default `"default"`, `size:0` renders invisibly | `packages/pfdn-moddle/CLAUDE.md`, root `CLAUDE.md#Nodes, types, and icons` |
| JSON-strict vs XML-lax core divergence; `pinned` default-false byte-identical round-trip | `packages/pfdn-moddle/CHANGELOG.md#0.2.0` |
| `pfdn.generated.ts` kept in lockstep with `pfdn.json` by a CI drift gate; `build` regenerates it first | `packages/pfdn-moddle/package.json#scripts`, `pfdn.generated.ts` header |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
