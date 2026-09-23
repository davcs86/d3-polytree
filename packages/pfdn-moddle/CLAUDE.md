<!-- context-forge:behavioral-contract:start -->
## How to Act

1. **Don't assume — ask, and surface tradeoffs.** *(enforced by `PLAT-03`)*
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** *(enforced by `MODDLE-02` IDREFs + `MODDLE-03` `xsi:type` on complex props; `PLAT-04`)*
4. **Define success up front, then loop until verified.** *(enforced by `MODDLE-04` — the byte-identical `toXML` round-trip oracle)*
<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->
> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · defects: [`docs/context-constitution-findings.md`](docs/context-constitution-findings.md) · inherits the root constitution. Forged by context-forge.
<!-- context-forge:constitution-pointer:end -->

# CLAUDE.md — @d3-polytree/pfdn-moddle

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

The `.pfdn` (Process Flow Diagram Notation) model — a [`moddle`](https://github.com/bpmn-io/moddle)
schema plus XML read/write. No rendering here.

- The schema is `src/pfdn.json`; types are `pfdn:Diagram`, `Node`, `Link`, `Label`, `Zone`,
  `Coordinates`, plus settings. `createPfdnModdle()` → `moddle.create(...)`, `fromXML`, `toXML`.
- **`Node.label` is an IDREF** (`isReference`), not a string. Assigning a raw string does not serialize
  correctly — pass the actual `pfdn:Label` object, or hand-author the `label="<id>"` attribute in XML.
  `Node.size` defaults to 25 and `Node.type` to `"default"` (moddle defaults apply on read).
- Owns the original mocha/chai-era test suite, ported to Vitest. Depends on `moddle` + `moddle-xml`
  only; no D3.
