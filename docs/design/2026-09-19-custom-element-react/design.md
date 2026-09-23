# Design: custom-element-react

**Created**: 2026-09-19
**Depth**: deep
**Rounds**: 6 (panel + 5 adversarial rounds; termination: approved at the round cap, verdict SOUND)
**Approved by**: user @ 2026-09-20
**Grounded in**: recon.md

---

## Chosen Approach

C7 ships the `<d3-polytree-editor>` Custom Element and a React adapter as **two new packages that
compose the existing `Editor`/`Viewer`** — no engine fork — plus one small **additive** engine change
that both adapters (and Track D / O16) depend on.

**1. Stable, reboot-surviving event surface on `Viewer`** (inherited by `InteractiveViewer`/`Editor`).
`importDiagram`/`createEmpty` rebuild the injector → a **new `eventBus` per boot** (`viewer/index.ts:114`,
`Diagram.ts:42`), and engine-internal features reboot the component off the host instance — verified:
`localStorage.ts:40`, `upload.ts:61`, palette "New" `PaletteProvider.ts:111` all call
`this._host.importDiagram/createDiagram()`. An adapter-side re-subscribe wrapper cannot see those, so a
subscription taken off the bus dangles silently. Fix once, on the long-lived component:

- Add `on(event, handler)` / `off(event, handler)`, with the generic **narrowed to the three
  reboot-surviving post-boot events** `'document.changed' | 'selection.changed' | 'commandStack.changed'`
  (typed via `DiagramEventMap`, imported from `@d3-polytree/core` which re-exports it — `core/src/index.ts:12`;
  no `declare module`). The narrow type matches the documented guarantee and prevents an `on('node.created')`
  that would miss the boot-time created-storm (drawers fire `*.created` synchronously inside `new Diagram`,
  before re-attach — `CLAUDE.md:74-76`).
- `Viewer` holds a `_handlers` registry of (event, handler) pairs **and** a `_bus` reference to the
  currently-bound bus. `on/off` mutate the registry and, if `_bus` is bound, attach/detach immediately.
- Split teardown: a private `_teardown()` destroys the Diagram (emitting `d3canvas.destroy` first) **then**
  detaches every registered handler via the **held `_bus` ref** (never `get('eventBus')`, which throws
  post-destroy — `viewer/index.ts:99`) and nulls `_bus`, **keeping** `_handlers`. Public `destroy()` =
  `_teardown()` + `_handlers.clear()`.
- `_boot` calls `this._teardown()` (not the virtual `this.destroy()`) then, after `new Diagram(...)`,
  resolves the new bus and re-attaches all registered handlers. **Bonus fix:** routing reboot through the
  non-virtual `_teardown()` fixes a latent bug where `_boot`'s `this.destroy()` dispatched to
  `Editor.destroy()` and stripped the ctor-added undo/redo keydown listener after one reboot
  (`editor/src/index.ts:84,115-117`).
- `@d3-polytree/viewer` gains `eventemitter3: ^5.0.1` as a dependency (siblings already declare it; the
  `_bus` field's `EventEmitter` type import needs it under pnpm strict resolution).

**2. `@d3-polytree/element`** — framework-free custom element, no runtime deps:

- `attachShadow({ mode: 'open', delegatesFocus: true })`; `:host { display: block }` with an explicit/measured
  size (Canvas `getSize()` reads `clientWidth/Height`, `Canvas.ts:117`); a `tabindex` so keyboard reaches the
  editor's container keydown listener (`editor/src/index.ts:84`). `connectedCallback` hosts an `Editor` in a
  `<div>` inside the shadow root via the `container` option (Canvas **appends**, `Canvas.ts:11,21`) and boots
  from the `value` attr/property or `createEmpty()`; `disconnectedCallback` → `destroy()`; guard
  `if (!customElements.get('d3-polytree-editor'))` before `define` (HMR re-entry).
- `value` (the `.pfdn` string) reflects as property ⇄ attribute; `attributeChangedCallback('value')` →
  `importDiagram`.
- **ElementInternals form association, feature-gated**: `const internals = this.attachInternals?.()`; on
  `document.changed` call `internals.setFormValue(exportDiagram())` only when
  `internals && typeof internals.setFormValue === 'function'` (jsdom implements `attachInternals` but its stub
  lacks `setFormValue`); otherwise degrade to value reflection + `CustomEvent('change')`. Never throws. Set
  `static formAssociated = true`; the element still delivers full value without ElementInternals.
- **Shadow-DOM CSS**: a `scripts/generate-styles.mjs` (Node stdlib, `createRequire` + `require.resolve` on
  the `./style.css` **export subpath** of BOTH `@d3-polytree/editor` and `@d3-polytree/interactive-viewer` —
  both declared as **direct deps** so pnpm strict resolution finds them; editor=properties/palette/drag,
  interactive-viewer=outline/notifications/side-tabs/search, both needed) concatenates the compiled CSS into a
  **committed** `src/styles.generated.ts` (icons-amazon `*.generated.ts` precedent; `build` runs the script
  before `tsup`; turbo `^build` guarantees upstream `dist/style.css` first). The element injects it via
  `adoptedStyleSheets` when present, else a `<style>` in the shadow root.
- **exportSVG shadow-CSS handling**: `Canvas.exportSVG` inlines CSS from `document.styleSheets`
  (`SvgExportingUtils.ts:53`), which is blind to shadow-scoped styles. `exportSVG()` returns a complete
  `<svg>…</svg>` string, so the element **wraps it and injects its own compiled CSS `<style>` into the returned
  string** — public API only, no engine change — with a test asserting the export carries the rules.
- UMD `d3PolytreeElement` global that self-registers the tag for `<script>` drop-in.

**3. `@d3-polytree/react`** — thin `useSyncExternalStore` wrapper, **uncontrolled contract**:

- `react`/`react-dom` `>=18` **required peers** (only here); `react@19`/`react-dom@19` devDeps; tests use
  `react-dom/client` `createRoot` + `act` from `'react'` (no `@testing-library/react`). `'use client'`.
- `defaultValue` (the `.pfdn`) applied once on mount; **controlled `value` is dropped** — `importDiagram` is a
  destructive async reboot that quarantines/clears the undo stack (`CommandStack.ts:52,183-188`) and drops
  selection, so a controlled value + onChange loop would echo and destroy history on every edit (DN-7). An
  imperative escape hatch (`ref` = `{ getEditor, load, export }`) covers external reloads; `load()`'s
  reboot-loss is documented.
- `onChange({ dirty, getValue })` fires on `document.changed` (the single change emit site,
  `CommandStack.ts:207`; all mutations route through the stack — verified incl. properties-panel
  `element.updateProperties`); `getValue` reads `exportDiagram()` lazily. `onSelectionChange(prev, next)` fires
  on `selection.changed`, **matching the bus/codebase tuple order** (`selection.ts:61`, `PropertiesPanel.ts:121`).
- `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`: `getSnapshot` returns a **monotonic
  version counter** on the adapter (bumped on the three events; never `exportDiagram()`, which returns a fresh
  string and would tear); `getServerSnapshot` returns the initial counter (SSR safety); `subscribe` uses the
  component's stable `on/off`, so it survives reboots.

**4. Tests** — per-package Vitest (jsdom): value reflection, connectedCallback boots + renders into the shadow
root + inlines CSS, disconnectedCallback destroys, `document.changed` → `CustomEvent('change')`, the
`setFormValue` guard not throwing + a shimmed-`setFormValue` spy, the exportSVG CSS injection, and (viewer) an
`on('document.changed')` subscription surviving a second `importDiagram`. Plus **one real-browser Playwright
test** reusing the **C8 Playwright runner/config** (not a Storybook story): `page.setContent('<form>…<d3-polytree-editor
name="…">')` on about:blank, inject the built element UMD via `page.addScriptTag({ content: readFileSync(dist umd) })`
(build-before-e2e), edit, assert `new FormData(form)` carries the `.pfdn`.

## Rejected Alternatives

- **Adapter-side re-subscribe (no engine change)** — cannot catch engine-internal reboots
  (`localStorage.ts:40`, `upload.ts:61`, `PaletteProvider.ts:111` reboot off the host, bypassing any adapter
  wrapper), so subscriptions dangle silently; also duplicated across element + react + Track D.
- **One package with two entries (element + ./react)** — leaks the React peer into element-only consumers'
  resolution graph; two packages keep React isolated (DN-8).
- **Compile the panels' SCSS in the element package** — the SCSS entries are package-local (`@import './…'`)
  and only `dist` ships, not `src/*.scss`, so a published element would have no SCSS to compile; read the
  compiled `dist/style.css` instead (single source of truth, drift-proof).
- **`adoptedStyleSheets`-only** — jsdom lacks it; feature-detect with a `<style>` fallback.
- **Controlled React `value`** — `importDiagram` is a destructive reboot; a controlled value/onChange loop
  echoes and clears undo/selection on every edit. Uncontrolled `defaultValue` + `onChange` + imperative
  `load()` is the honest React idiom for a heavyweight editor whose "set value" is a reboot (DN-7).
- **Re-emit initial `*.created` on re-attach** — would double-fire for surviving handlers and re-couple
  adapters to the boot-order invariant; scope the surface to post-boot events instead.
- **`on/off` on `Diagram`/the engine bus** — the bus dies per reboot; the stable surface must live on the
  long-lived component.

## Open Risks

- [ ] **`exportSVG()` shadow-CSS gap** — handled by wrapping the export in the element to inject its compiled
      CSS; covered by a test. To be implemented in the element package (no engine edit).
- [ ] **Browser-only form participation** — jsdom cannot exercise `setFormValue`; covered by the guarded/spied
      unit path + the one Playwright form test. Documented as browser-verified.
- [ ] **Consumer must give the element layout** (`:host` size) or `getSize()` reads 0 — documented; the element
      sets a sane default `:host { display: block }` height.
- [ ] **First React in the monorepo** — the regenerated `pnpm-lock.yaml` must be committed (frozen install).
- [ ] **O11 dependency** — `onChange` completeness relies on all mutations flowing through the command stack
      (verified today); a future off-stack mutation would be missed. Shares C4's O11 guard posture.

## Principles & Host Rules Touched

- `DN-2` (reuse) — compose the existing components; reuse `get('eventBus')`/`DiagramEventMap`, the package/tsup
  template, the icons-amazon generated-file pattern, and the C8 Playwright runner.
- `DN-7` (YAGNI) — uncontrolled-only React contract (no controlled `value`); no `@testing-library`; read
  compiled CSS rather than re-authoring SCSS; `on/off` narrowed to three events.
- `DN-8` (SOLID) — element (framework-free) and react (peer) are separate single-responsibility packages;
  the stable event surface has one responsibility (bus lifecycle) on `Viewer`.
- `DN-9` — the engine `on/off` surface is justified over adapter duplication by the verified internal-reboot
  paths and Track D (O16); the one browser test is right-sized vs a jsdom-only gap.
- Host rule "D3 slices are peer deps … never a `d3` bundle" (`packages/core/CLAUDE.md:22`) — honored: no D3 in
  the new packages.
- Host rule (didi last-wins / created-listeners before drawers, `CLAUDE.md:70,74-76`) — untouched: C7 adds no
  didi module; the created-storm concern is why the surface is scoped to post-boot events.
- Host rule (pnpm 10 pin, `CLAUDE.md:35-36`) — untouched; only the lockfile regenerates.
- Ledger (2026-09-18 typed-event-bus): `DiagramEventMap` is a plain exported type at the sink; import it, never
  `declare module`-augment. (2026-09-18 deterministic-ids): no `['type',X]` service gains a ctor arg → no
  `$inject` gap.

## Waivers

None. No `DN-*` objection was waived; all resolved in the design or carried as recorded open risks / plan
constraints.
