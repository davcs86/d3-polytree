# Recon: custom-element-react

**Created**: 2026-09-19
**Change**: C7 — `<d3-polytree-editor>` Custom Element (shadow DOM, ElementInternals form association of the serialized `.pfdn`) + a thin React wrapper bridging the typed event bus via `useSyncExternalStore`. Track D prerequisite (O16).
**Depth**: deep
**Affected areas**: NEW package(s) under `packages/*`; consumes `@d3-polytree/editor`/`viewer` public API + `@d3-polytree/canvas` `DiagramEventMap`. No changes to the engine expected beyond (possibly) a stable event surface.

---

## Repo Profile

pnpm 10 + Turborepo monorepo of `@d3-polytree/*` TS/ESM packages (strict, modular D3 v7 peers). New packages auto-register via the `packages/*` glob (`pnpm-workspace.yaml:1`); no root tsconfig references. Per-package tsup (ESM+CJS+dts) + a second UMD `iife` pass (`globalName: d3Polytree*`), dart-sass CLI for CSS; Vitest (jsdom); Changesets (new packages auto-included; only `@d3-polytree/storybook` is ignored). CI (Node 20): install → lint → typecheck → test → build → build-storybook.

## Codebase Map

- **Components (host targets)** — `Editor extends InteractiveViewer extends Viewer`
  - `Viewer` base + `ViewerOptions { container?: HTMLElement; modules?; [k]: unknown }` — `packages/viewer/src/index.ts:29,60`; the `_boot(host)` wiring seam — `:114`
  - Public API (all components): `importDiagram(xml): Promise<void>` `:70`; `createEmpty()` `:75`; `getHost()` `:80`; `exportDiagram(): string` (sync, `moddle.toXML`) `:85,89`; `exportSVG()` `:93`; `get<T>(token)` `:98`; `destroy()` `:106`
  - Editor-only: `createDiagram()` `packages/editor/src/index.ts:121`; `createNode()` `:144`; `select()` `:151`; `deleteSelected()` `:159`; `autoLayout()` `:167`; `undo/redo/canUndo/canRedo` `:172-187`; `destroy()` override removes a keydown listener `:115`
  - `Diagram` bootstrap: `new Injector(modules)` per boot — `packages/core/src/Diagram.ts:42`; `get<T>(token)` `:70`; `destroy()` emits `d3canvas.destroy` `:74`
- **Container contract** — `Canvas` **appends** a `<div class="pfdjs-container">` child into `options.container ?? document.body` (never replaces) — `packages/canvas/src/Canvas.ts:11,21`; container typed `HTMLElement` — `packages/canvas/src/types.ts:6`; `getSize()` reads `clientWidth/clientHeight` (0 if detached/unstyled) — `Canvas.ts:117`. Teardown is event-driven: `d3canvas.destroy` removes the canvas div — `Canvas.ts:60,63`.
- **Typed event bus (C12)** — `DiagramEventMap` (exported) — `packages/canvas/src/events.ts:116`; `LiteralEvents` `:80`. Key events: `document.changed: [{ dirty: boolean }]` `:104`; `selection.changed: [prev, next]` `:95`; `commandStack.changed: [{ canUndo, canRedo }]` `:103`; `<class>.{created|updated|removed}` `:57`. Single `eventemitter3` per injector (`eventBus: ['type', EventEmitter]`) — `packages/canvas/src/module.ts:20`; reached via `component.get('eventBus')` (`.on`/`.off`). `document.changed` emitted at `CommandStack.ts:207` (`dirty = canUndo`).
- **Packaging templates** — component `package.json` (`exports` `.`/`./umd`/`./style.css`, `sideEffects:false`, `publishConfig.access:public`) — `packages/editor/package.json:11,23,43`; simplest no-CSS/no-UMD template — `packages/ssr/package.json:24`. tsup dual-pass + UMD — `packages/editor/tsup.config.ts:13,22`. D3 peers declared ONLY in core — `packages/core/package.json:34`. Vitest jsdom — `packages/editor/vitest.config.ts:2`.

## Patterns to REUSE

- **Host the existing `Editor`/`Viewer` as-is** (compose, don't fork): the custom element instantiates a component with `container` = an element inside its shadow root; the React wrapper wraps the same. Reuse `importDiagram`/`exportDiagram`/`get('eventBus')`/`destroy` (DN-2).
- **The component package template** (`packages/editor/package.json` + `tsup.config.ts`): copy the dual library + UMD pass, `exports`, `sideEffects`, `publishConfig` for the new package(s).
- **`get('eventBus')` + `DiagramEventMap`** (`canvas/src/events.ts:116`): the bridge subscribes here; do not invent a new event system.
- **`document.changed {dirty}`** (`CommandStack.ts:207`) as the change signal for ElementInternals `setFormValue` + React `onChange`/snapshot.
- **Changesets `.changeset/*.md`** + auto-include (`.changeset/config.json:8`).

## Host Conventions & Hard Rules

- **Hard rule** (D3 peers, if any engine code is touched): "D3 slices are **peer** deps — import from the specific `d3-*` package, never a `d3` bundle." — `packages/core/CLAUDE.md:22` (the new packages shouldn't import D3 at all).
- **Hard rule** (pnpm pin): "do **not** downgrade to pnpm 9 or bump to pnpm 11" — `CLAUDE.md:35-36`.
- **Hard rule** (didi): "Last definition of a token wins" / created-listeners before drawers — `CLAUDE.md:70,74-76` (only relevant if C7 adds a module; it likely doesn't).
- Convention: UMD global `d3Polytree*` — `packages/*/tsup.config.ts:25`. New-package convention lives only in root/per-package `CLAUDE.md` (no "adding a package" doc).

## Dependencies

- Data / schema: none (C7 is a packaging/adapter layer; the document is the existing `.pfdn` string from `exportDiagram`).
- External contracts: NEW public surfaces — the custom element tag `<d3-polytree-editor>` (attributes/properties: `value`/`readonly`/…), its `CustomEvent`s, and the React component's props. **React becomes a new peer dependency** (only in the React package). ElementInternals form-value contract.
- Config / environment: none.
- Cross-area edges: new package → `@d3-polytree/editor`/`viewer` (`workspace:*`) → `@d3-polytree/canvas` (`DiagramEventMap`). No engine edges expected.

## Risks / Not-found

- **Reboot recreates the eventBus.** `importDiagram`/`createEmpty` call `_boot`, which `destroy()`s and builds a NEW `Diagram` → NEW `Injector` → **NEW eventBus** (`viewer/index.ts:114`, `Diagram.ts:42`). A React `useSyncExternalStore` subscription (or a custom-element listener) taken off the old bus **dangles after a re-import** — and `get('eventBus')` throws after `destroy()`. This is the central lifecycle problem; the bridge must re-wire on each boot, or the components must grow a **stable event surface** that outlives reboots. `## Not found`: no such stable surface exists today (no `on`/`off` on components).
- **No shadow-DOM style mechanism.** CSS ships as global `dist/style.css` authored against `.pfdjs-*` classes; there is **no** `adoptedStyleSheets`/`<style>`-injection pattern anywhere. A shadow-rooted element must inline the compiled CSS into its shadow root (new mechanism). `## Not found`.
- **React is brand-new** — no React/react-dom/@testing-library/@types/react anywhere; the React peer + its test tooling are net-new additions.
- **`useSyncExternalStore` tearing** — `getSnapshot` must be referentially stable between changes; `exportDiagram()` returns a fresh string each call, so it is unsuitable as a raw snapshot (would tear / loop). A version counter bumped on `document.changed` is the safer snapshot.
- **Container size** — inside a shadow root the host must have layout (`clientWidth/Height`), else `getSize()` reads 0 (`Canvas.ts:117`).
- **Ledger trap (2026-09-18 typed-event-bus)** — a shared type extended across packages must be one plain exported interface at the sink (`canvas`), not a `declare module` augmentation (dropped by the dts bundler). Relevant if C7 adds shared event/prop types.
- **Ledger trap (2026-09-18 deterministic-ids)** — a `['type', X]` didi service gaining a constructor arg needs `$inject`; relevant only if C7 adds an engine module (it should not).

## Recommended Scope

Add the Custom Element and the React adapter as **new package(s)** under `packages/*` that **compose the existing `Editor`/`Viewer`** — no engine fork. The custom element attaches a shadow root, hosts a component in a div inside it, inlines the compiled component CSS into the shadow root, reflects a `value` (the `.pfdn` string) attribute/property, and does ElementInternals form association driven by `document.changed`. The React wrapper bridges the bus via `useSyncExternalStore` with a version-counter snapshot and a stable subscribe that survives `importDiagram` reboots. Decide in the debate: **one package vs two** (element + react); whether to add a **stable, reboot-surviving event surface** to the components (benefiting both adapters) vs. re-wiring in each adapter; the **snapshot strategy** (version counter vs value); and the **shadow-DOM CSS** delivery (constructable stylesheet from the built CSS string vs `<link>` vs `<style>` text).
