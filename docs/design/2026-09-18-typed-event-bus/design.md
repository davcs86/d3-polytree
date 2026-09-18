# Design: typed-event-bus

**Created**: 2026-09-18
**Depth**: full
**Rounds**: 2 (termination: approved — full coverage)
**Approved by**: user @ 2026-09-18 (gate: "Full coverage (M) — recommended")
**Grounded in**: recon.md

---

## Chosen Approach

Type the single shared `eventemitter3` bus with **one consolidated, exported `interface DiagramEventMap` defined once in `packages/canvas`** — the dependency sink every other package already imports (`canvas ← core ← viewer ← interactive-viewer ← editor`, recon.md:57). Map values are **argument tuples**; the bus is consumed everywhere as `EventEmitter<DiagramEventMap>` via injection-site type annotations. **No cross-package `declare module` augmentation.** The runtime DI token is byte-for-byte unchanged — `eventBus: ['type', EventEmitter]` (`module.ts:20`); the generic is a compile-time-only annotation, so the single-shared-instance invariant holds and didi is unaffected.

**Why consolidated, not per-package augmentation (the decisive round-2 evidence).** tsup/rollup-plugin-dts drops standalone/ambient `declare module` blocks from the emitted `.d.ts`: the existing `declare module 'moddle'` shim (`packages/pfdn-moddle/src/moddle.d.ts:3`) does **not** appear in `packages/pfdn-moddle/dist/index.d.ts` (grep exit 1). A downstream `declare module '@d3-polytree/canvas'` augmentation would therefore not survive to published consumers, and — because `turbo typecheck` is `dependsOn: ^build` (recon.md:12), consuming built `.d.ts` of deps — would not even reach downstream local typechecks. A **plain exported interface**, by contrast, bundles cleanly and the cross-package path is already in production: `packages/core/src/draw/types.ts:2` imports `RegisteredElement` from `@d3-polytree/canvas` and `DiagramElement extends RegisteredElement` (`canvas/src/types.ts:14`). `EventEmitter<DiagramEventMap>` imported into core resolves exactly as `RegisteredElement` already does.

**The map (evidence: recon.md event inventory, §"Complete distinct bus event inventory").** Keys are authored as literal unions and template-literal mapped types over the finite `ElementClass` union (`packages/core/src/modelling/Modelling.ts:9`) — but since `ElementClass` lives in core and the map lives in canvas, canvas declares its own `type ElementClassName = 'node' | 'link' | 'label' | 'zone'` (structurally identical) plus a `MouseKind` union. Families: `canvas.*`/`d3canvas.*` (no payload or `[{ svg: SvgSelection }]`, `canvas/src/types.ts:33`); per-class `` `${ElementClassName}.${'created'|'updated'|'removed'|'moving'}` `` → `[GroupSelection, model]`; the 4×9 mouse matrix `` `${ElementClassName}.${MouseKind}` `` → `[GroupSelection, model, Event]`, with `.click` reconciled to `[GroupSelection, model, { ctrlKey?: boolean } | null]` (a DOM `Event` is structurally assignable to `{ ctrlKey?: boolean }`, and `null` is assignable — so `mouseEvents.ts:46` and `selection.ts` compile unchanged); literal `label.deleted`, `node.deleted`/`link.deleted` (subscribed-only, no emitter — keys declared so subscriptions type-check); `selection.changed` `[SelectionEntry[], SelectionEntry[]]`; `outline.*`; `zoom.*`; `commandStack.changed` `[{canUndo,canRedo}]`, `document.changed` `[{dirty}]`, `document.inconsistent`; `elements.delete` (a real bus emit — `selection.ts:79`); `sidetab.registered`; `PropertiesPanel.propertyChanged`.

**Model-slot typing.** The element/selection slot is fully recovered by canvas's existing `GroupSelection` (`canvas/src/types.ts:34`). For the *definition* slot, **reuse canvas's existing `RegisteredElement`** (`{ id?; [key: string]: unknown }`) rather than minting a new shadow interface — core's `ModellingModelElement` / `DiagramElement` already structurally satisfy it (`DiagramElement extends RegisteredElement`, `canvas/src/types.ts:14`). Rich model precision on the *subscribe* side (typed `.position`, `.waypoint`, etc.) is delivered by each callback's own parameter annotation (e.g. `drag.ts:159`, `SearchPanel.ts:75-84`), which eventemitter3's bivariant `on` listener checking already permits — **not** by the map. The map's honest guarantee is emit-site key + arity + primitive-payload checking; that is exactly the safety C12 targets (ROADMAP:480 — "the compiler, not review, catches a dispatcher wired to the wrong payload").

**Coverage = full (M), per the approved gate.** Flip `_eventBus: EventEmitter` → `EventEmitter<DiagramEventMap>` at every declaration/injection/`get<EventEmitter>` site (~30 files: Canvas, Diagram, BaseElement, mouseEvents, selection, drag, zoom, axes, outline, resizeElement, backgroundColor, tooltip, AddLinkTool, PaletteProvider, CommandStack, Modelling, ModellingElement, draw Links/Labels/Nodes/Zones, SideTabs(+Provider), SearchPanel, PropertiesPanel, EntryFactory, PfdnPropertiesProvider). Plus the 5 interpolated-key casts so keys resolve to literal unions: `BaseElement._className: string → ElementClass` + ctor param (covers `.created/.updated/.removed`), `mouseEvents.ts:43,46` cast, `drag.ts:139` cast, `SearchPanel.ts:137-138` cast. Command strings (`element.create/delete/resize/move`) stay OUT of the map (they route through `commandStack.execute`, `modelling/commands.ts:260-273`); the boundary is "emitted on the eventBus" vs "handed to commandStack.execute". `packages/viewer` is untouched (bus reached only via generic `get<T>`, `viewer/src/index.ts:98`; no `eventemitter3` dep added). Ship as a Changesets **minor** across the touched packages (exported-type change, pre-1.0, per O12 precedent, recon.md:55).

**Build order:** canvas → core → viewer → interactive-viewer → editor (turbo `^build`). No module-registration reorder anywhere (boot-order invariant untouched).

## Rejected Alternatives

- **Per-package `declare module '@d3-polytree/canvas'` augmentation** (round-1 approach) — rejected: rollup-plugin-dts drops ambient/augmentation blocks from emitted `.d.ts` (proven: `pfdn-moddle`'s `declare module 'moddle'` absent from its dist), so augmentations would silently not reach downstream consumers or `^build`-gated typechecks; the "co-locate + assertMerged" mitigation is fragile build-tooling iteration.
- **Ownership split by emitting package** (round-1) — rejected: factually wrong against the topology (`element.updated` flows editor→core, against the dep arrow — emit `PfdnPropertiesProvider.ts:147,151`, subscribe `Modelling.ts:94-95`); a consolidated single interface dissolves the split entirely.
- **New structural `DiagramEventModel` shadow interface + `ModellingModelElement extends DiagramEventModel` guard** — rejected: the guard checks the wrong direction (adding a field to the model preserves `extends`, so it never fires), and the rich subscribe-side precision comes from callback annotations regardless; reusing existing `RegisteredElement` is strictly smaller and avoids a DN-2 duplicate.
- **Minimal/high-value coverage (S)** — rejected at the gate: leaves the rich event surface unchecked; the user chose full coverage to realize C12's emit-site safety purpose.

## Open Risks

- [ ] **Interpolated mouse-matrix emit is loosely enforced.** `emit(\`${type}.${kind}\`, …)` over a 36-key union only needs args assignable to *one* constituent, so `.click`'s divergent payload is not enforced at that emit site (enforcement bites at literal-key emits + the subscribe side). Accepted — document in the map's doc comment so a future reader doesn't over-trust it. — addressed at implementation (code comment on the mouse-matrix keys).
- [ ] **Model-slot subscribe precision is annotation-borne, not map-borne.** Subscribers reading `.position`/`.waypoint` get typed values via their own callback annotations (bivariant `on`), which the map (promising only `RegisteredElement`) does not back. Not a regression vs. the untyped status quo; state it honestly in the design comment. — addressed at implementation.
- [ ] **`node.deleted`/`link.deleted` are subscribed but never emitted** (`SearchPanel.ts:81-84`) — pre-existing gap, out of scope; keys are declared so subscriptions type-check. — no action.

## Principles & Host Rules Touched

- `DN-2` (DRY) — honored: reuses eventemitter3's own `EventEmitter<EventTypes>` generic (no new emitter abstraction) and canvas's existing `RegisteredElement`/`GroupSelection` for payload slots (no shadow types).
- `DN-7` (YAGNI) — honored: single exported interface, no augmentation machinery, no typed accessor on `get<T>`, no `assertMerged` tripwire, no new `DiagramEventModel`.
- `DN-8` (SOLID) — honored: the map is a single stable seam at the dependency sink; consumers depend on the exported interface, not internals.
- `DN-9` (staff-engineer check) — honored: consolidated map chosen on empirical dts evidence over the "cleaner-looking" per-package split; scope sized honestly at M; enforcement claims stated precisely (emit-site, not subscribe-side).
- Host rule "The eventBus is a single `eventemitter3` instance provided by `canvasModule`; every feature injects the same one." (`packages/core/CLAUDE.md:20`) — honored: token value unchanged, typing is compile-time only.
- Host rule "Boot order = event-subscription order… Moving a created-listener after the drawers silently drops the initial elements." (`CLAUDE.md:71,76`) — honored: no module-list reorder; pure retyping.
- Ledger 2026-09-18 (didi default-arg `$inject` crash) — honored: no constructor argument added anywhere; `EventEmitter` stays zero-arg constructible, `parseAnnotations` unaffected.

## Waivers

- `DN-9` (OBJ-B — `.click` split-key enforcement) — waived: the split is kept for subscribe-side correctness and documented as loosely enforced at the interpolated emit; the user accepted full coverage knowing the matrix emit is not strictly enforced.
- `DN-9` (OBJ-C — model-slot precision is annotation-borne) — waived: accepted as an honest, non-regressive limit of a consolidated map without upward imports.
