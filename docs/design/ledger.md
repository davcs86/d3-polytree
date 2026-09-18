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

### 2026-09-18 — deterministic-ids-ssr — didi parses a default-arg constructor and crashes without $inject
- **Lesson**: A `['type', X]` didi service whose constructor gains ANY argument (even one with a default value) MUST declare `static readonly $inject = [...]`. didi's `parseAnnotations` regex parses the constructor and tries to `get()` the parsed param token, throwing "No provider" at boot — direct `new X()` construction in tests masks it. Verify against `didi/dist/index.js` (parseAnnotations / instantiate), not by assuming zero-arg construction.
- **Evidence**: `packages/canvas/src/ElementRegistry.ts:12`; `packages/canvas/src/Canvas.ts:31` ($inject precedent); didi `parseAnnotations`

### 2026-09-18 — deterministic-ids-ssr — "no browser" is not "no DOM"; install jsdom by add-only surface copy
- **Lesson**: The draw layer reads the GLOBAL `document`/`XMLSerializer`/`DOMParser`, not an injected Document, so a Node renderer must set `globalThis` from a jsdom and restore in `finally`. Copy jsdom `window`'s own-property surface ADD-ONLY (`!(key in globalThis)`) so JS intrinsics aren't clobbered (cross-realm `instanceof` breaks otherwise); hand-enumerating globals silently drops one (e.g. `DOMParser`, needed on every render via IconLoader). Render is synchronous after `await loadModel`, so the global-swap window is safe; a serial mutex covers overlapping calls.
- **Evidence**: `packages/canvas/src/Canvas.ts:11,105`, `packages/core/src/draw/IconLoader.ts:79`, `packages/canvas/src/SvgExportingUtils.ts:13`

### 2026-09-18 — deterministic-ids-ssr — a deterministic id generator must pre-claim author ids
- **Lesson**: `ElementRegistry.claimId` interleaves generation with author-set ids during the boot render loop, so a sequential generator can mint an id that collides with a later author id. Pre-claim every existing `element.id` in the loaded model (the four stamped collections node/link/label/zone) BEFORE boot; back the generator with a claimed-id Set that skips claimed ids. Model-presence ≠ claimed — verify the claim timing in the boot loop.
- **Evidence**: `packages/core/src/draw/BaseElement.ts:102,142-147`; `packages/canvas/src/ElementRegistry.ts:22-26`; `packages/editor/src/index.ts:43-44` (author-set node_1/label_1)

### 2026-09-18 — deterministic-ids-ssr — DEVIATION: dropped `@types/jsdom` for a scoped ambient shim
- **Lesson**: Plan Step 2 declared `@types/jsdom` as a devDependency, but the `registry.npmjs.org` metadata endpoint was 503 registry-wide during implementation (confirmed: even already-installed `vitest` 503'd on `/metadata`), so `@types/jsdom` could not be fetched. The renderer touches exactly one jsdom symbol (`new JSDOM(html, opts).window`), so a `packages/ssr/src/jsdom.d.ts` ambient `declare module 'jsdom'` covering just that slice is both leaner (no `@types/node`/`@types/tough-cookie` fan-out) and immune to a types-only package's registry availability. jsdom@25.0.1 itself was already lockfile-pinned + in the store; adding the `packages/ssr` importer edge to `pnpm-lock.yaml` by hand let `pnpm install --offline --frozen-lockfile` link it with zero metadata lookups. Promote to real `@types/jsdom` only if a future change needs more of jsdom's surface.
- **Evidence**: `packages/ssr/src/jsdom.d.ts`; `packages/ssr/package.json` (no `@types/jsdom`); `pnpm-lock.yaml` (`packages/ssr:` importer, `jsdom: 25.0.1`)
