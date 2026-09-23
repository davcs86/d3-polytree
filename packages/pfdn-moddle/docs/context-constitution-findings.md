# @d3-polytree/pfdn-moddle — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

_None open._

## Latent bugs (looks broken, not merely non-obvious)

| Issue                                                                                                                                                                  | Impact                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Evidence                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `createPfdnModdle(additionalPackages, options)` accepts extra packages/options, but `fromJson`/`buildTree` instantiate a fresh `new PfdnModdle({ pfdn: pfdnPackage })` | JSON loading **ignores** any caller-extended packages/options. **Root cause:** the JSON adapter's `SCHEMA`/`CONCRETE_TYPES` are _generated from the base `pfdn.json`_, so the JSON path is base-schema-only by construction (extended types would already fail `validate`). This is a **design limitation**, not a quick fix — threading extra packages requires re-generating the typed schema. Decide: document the limitation, or invest in a schema-extension path. | `packages/pfdn-moddle/src/json.ts#buildTree`, `#validate` |

## Dead / orphaned code

| What                                                    | Why it looks dead                                                                  | Evidence                                                                                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `isVirtual` handling in `generate-pfdn.mjs` + `json.ts` | defensive branch skipped in both, but `grep` finds zero `isVirtual` in `pfdn.json` | `packages/pfdn-moddle/scripts/generate-pfdn.mjs#resolveProps`, `packages/pfdn-moddle/src/json.ts#toJsonElement` |

## Open questions (unresolved _why_ — needs a maintainer)

- `pfdn:Zoom.offset` default `{ x:0, y:0, scale:2 }` carries a `scale` key `Coordinates` doesn't define, while `Zoom.scale` defaults to 1 — meaningful legacy default or copy-paste cruft? — status: **open**
- `pfdn:Zoom.scale` serializes as a **child element** (not `isAttr`) unlike every other scalar — intentional for the legacy on-disk format, or an oversight? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

| What the docs say / issue                       | Evidence (was)                                 | Resolved   | How confirmed                                                   |
| ----------------------------------------------- | ---------------------------------------------- | ---------- | --------------------------------------------------------------- |
| README: `const { xml } = await moddle.toXML(…)` | `packages/pfdn-moddle/src/PfdnModdle.ts#toXML` | 2026-09-23 | README fixed: `toXML` is sync → `string`                        |
| README: `const rootElement = fromJson(doc)`     | `packages/pfdn-moddle/src/json.ts#fromJson`    | 2026-09-23 | README fixed: `fromJson` returns a `Result` (shows `parsed.ok`) |
| README: `moddle`/`moddle-xml` "bundled"         | `packages/pfdn-moddle/tsup.config.ts#external` | 2026-09-23 | README fixed: regular runtime deps, not bundled                 |

---

_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
