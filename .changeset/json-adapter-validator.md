---
'@d3-polytree/pfdn-moddle': minor
'@d3-polytree/core': minor
---

JSON adapter + generated runtime validator + typed documents (roadmap C11).

An additive JSON path over the **same** moddle model — consumers get typed, validated
documents without touching XML (roadmap O1 left this open). No new dependency.

- **`@d3-polytree/pfdn-moddle`** — new `toJson`/`fromJson`, `validate`/`assertValid`, and
  generated typed document interfaces (`PfdnDocument`, `PfdnNode`, …), all on the existing
  main entry.
  - `toJson` walks the moddle `$descriptor` (references are stored non-enumerably and
    defaults on the prototype, so a plain `JSON.stringify` would silently drop both),
    reading raw own values and mirroring moddle-xml's writer predicate exactly — references
    collapse to id strings, defaults are omitted, so documents are small and hand-diffable.
  - A **dependency-free validator generated from `pfdn.json`** (a `generate-pfdn.mjs` emits a
    committed `pfdn.generated.ts` — a descriptor table + interfaces; a CI drift gate keeps it
    in lockstep with the schema). It is strict by default (rejects unknown properties/types,
    wrong scalar types, mis-placed element types, duplicate ids, and unresolvable/
    wrong-typed references) and collects **all** errors as a `Result` with JSON-Pointer paths;
    `{ lax: true }` drops unresolvable references instead.
  - `fromJson` validates first, then rebuilds the tree in two passes (create, then re-link
    references via the moddle setter), so forward references resolve correctly.
- **`@d3-polytree/core`** — `loadModelFromJson(input, { lax? })`, the JSON twin of
  `loadModel`, reusing the same `ensureSettings`/`routeLinks` normalisation so a JSON-loaded
  model boots every component identically. It validates strictly and throws a
  `PfdnValidationError` on any violation — a deliberate, documented divergence from
  `loadModel`'s XML lax-tolerance (a JSON document is a new external contract); `{ lax: true }`
  restores the tolerant behaviour.
