# design-buddy — lessons ledger

Append-only. One entry per lesson, newest at the bottom. Future design-buddy runs read this
during recon and hand relevant entries to the adversary.

Entry schema:

### <ISO date> — <change slug> — <lesson | trap>
- **Lesson**: <one line — what worked, or what went wrong>
- **Evidence**: <path:line, PR, or design doc reference>

<!-- Append entries below. Newest at the bottom. -->

### 2026-09-17 — command-stack-undo-redo — a gesture mutates more serialized props than the obvious one
- **Lesson**: Drag/Resize write the associated `pfdn:Label` (position + status) and flip `status` 0→2, not just the node's position. Any model-mutation or serialization change must enumerate the COMPLETE serialized write set per gesture (grep `features/` for `.set(`/`.position`/`.size`/`.status`/`.isReadOnly` exhaustively), or `toXML` residue survives after an inverse operation.
- **Evidence**: `packages/core/src/features/drag.ts:50-56,80-86`; design doc `docs/design/2026-09-17-command-stack-undo-redo/design.md` (capture set)

### 2026-09-17 — command-stack-undo-redo — derived state can be recomputed, not stored, when its producer is pure
- **Lesson**: The link waypoint router is a pure, fully-recomputed function of model position/size (`_setSideConnectors` allocates fresh `sides` each call and overwrites; `_routing` is scratch). Derived state with a pure producer should be recomputed on inverse/replay rather than captured — it avoids a two-writer race and stays byte-identical. Verify purity in code before relying on it; if the producer accumulates hidden state, the assumption is unsound.
- **Evidence**: `packages/core/src/modelling/Links.ts:231,263,348`

### 2026-09-17 — command-stack-undo-redo — an eslint token rule can't prove mutation totality
- **Lesson**: A lint rule keyed on a token (e.g. `definitions.*`) matches none of the real write sites — `collections.add/remove`, moddle `.set(`, and type-erased bare assignments (`(def.position as Point).x =`). Gate mutation/serialization totality on a `toXML` round-trip test (authoritative); keep lint as a cheap tripwire on named, syntactically-matchable primitives only.
- **Evidence**: `packages/core/src/features/drag.ts:81`, `packages/core/src/features/resizeElement.ts:74`; RFC ROADMAP.md:601-602
