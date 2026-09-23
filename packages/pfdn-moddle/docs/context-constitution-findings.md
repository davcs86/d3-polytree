# @d3-polytree/pfdn-moddle — Constitution Findings

Defects and drift surfaced by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. For triage/fixing, not governance.

## Documentation that lies (docs claim behavior the code lacks)

| What the docs say | What the code does | Evidence | Suggested action |
|---|---|---|---|
| README: `const { xml } = await moddle.toXML(rootElement)` | `toXML` is **synchronous and returns a `string`** — not a Promise, not `{ xml }` | `packages/pfdn-moddle/README.md`, `packages/pfdn-moddle/src/PfdnModdle.ts#toXML` | Fix the README example |
| README: `const rootElement = fromJson(doc)` | `fromJson` returns a `Result` (`{ ok, value } \| { ok:false, errors }`), so `rootElement` would be the Result | `packages/pfdn-moddle/README.md`, `packages/pfdn-moddle/src/json.ts#fromJson` | Fix the README example |
| README: `moddle` and `moddle-xml` are **bundled** dependencies | Both are `external` in tsup and plain `dependencies` — installed transitively, not bundled into `dist` | `packages/pfdn-moddle/README.md`, `packages/pfdn-moddle/tsup.config.ts#external` | Correct the README wording |

## Latent bugs (looks broken, not merely non-obvious)

| Issue | Impact | Evidence |
|---|---|---|
| `createPfdnModdle(additionalPackages, options)` accepts extra packages/options, but `fromJson`/`buildTree` instantiate a fresh `new PfdnModdle({ pfdn: pfdnPackage })` | JSON loading **ignores** any caller-extended packages/options | `packages/pfdn-moddle/src/json.ts#buildTree` |

## Dead / orphaned code

| What | Why it looks dead | Evidence |
|---|---|---|
| `isVirtual` handling in `generate-pfdn.mjs` + `json.ts` | defensive branch skipped in both, but `grep` finds zero `isVirtual` in `pfdn.json` | `packages/pfdn-moddle/scripts/generate-pfdn.mjs#resolveProps`, `packages/pfdn-moddle/src/json.ts#toJsonElement` |

## Open questions (unresolved *why* — needs a maintainer)

- `pfdn:Zoom.offset` default `{ x:0, y:0, scale:2 }` carries a `scale` key `Coordinates` doesn't define, while `Zoom.scale` defaults to 1 — meaningful legacy default or copy-paste cruft? — status: **open**
- `pfdn:Zoom.scale` serializes as a **child element** (not `isAttr`) unlike every other scalar — intentional for the legacy on-disk format, or an oversight? — status: **open**

## Dismissed (won't fix)

_None._

## Resolved

_None._

---
_Surfaced by [context-forge](https://github.com/davcs86/agent-plugins). Open items are defects to action,
not rules to keep (CF-N8)._
