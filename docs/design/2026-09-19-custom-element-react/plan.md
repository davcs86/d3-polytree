# Implementation Plan: custom-element-react

**Status**: `pending`
**Created**: 2026-09-20
**Design**: [design.md](./design.md)
**Test harness**: `pnpm --filter @d3-polytree/<pkg> test` (vitest jsdom); Playwright e2e via `apps/storybook` (`@playwright/test` 1.56.1, container-pinned); full gate `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook` (CI `.github/workflows/ci.yml`)
**Total Steps**: 8
**Review**: `passed-with-warnings @ 2026-09-20`

---

## Execution Summary

Engine seam first (the stable `on/off` on `Viewer`, with its own test), then the two new packages that
consume it, then the browser test, then release/docs. The element and react packages both depend on the
engine change, so it lands first. Order keeps the tree green: each package builds on already-built
upstreams (turbo `^build`); the committed `styles.generated.ts` is produced by a build step so typecheck
finds it.

## Step Dependencies

- Steps 2–4 (element) and 5–6 (react) require Step 1 (the `on/off` surface).
- Step 3 (element CSS) requires the element package scaffold (Step 2) and upstream `dist/style.css` (turbo `^build`).
- Step 7 (Playwright) requires Step 2–4 (built element UMD).
- Step 8 (changesets/docs) requires all code steps.

---

### Step 1 — Stable `on/off` event surface on `Viewer` (+ eventemitter3 dep)

**Status**: `pending`
**Files**:
- `packages/viewer/src/index.ts` — modify
- `packages/viewer/package.json` — modify (add `eventemitter3`)
- `packages/viewer/src/onoff.test.ts` — create

**Evidence**:
- `destroy()` body: `packages/viewer/src/index.ts:106-112`; `_boot` calls `this.destroy()` at `:116`; `new Diagram(...)` at `:125-134`; `get()` throws when `_diagram` null `:98-102`.
- Event types: `DiagramEventMap` re-exported from core — `packages/core/src/index.ts:12`; the three post-boot events `document.changed`/`selection.changed`/`commandStack.changed` — `packages/canvas/src/events.ts:104,95,103`.
- `eventemitter3` dep precedent: `packages/editor/package.json` + `packages/interactive-viewer/package.json` declare `eventemitter3: ^5.0.1`; viewer does not (confirm `packages/viewer/package.json`).

**Instructions**:
Add to `Viewer`: `import type EventEmitter from 'eventemitter3'` and `import type { DiagramEventMap } from '@d3-polytree/core'`. Define `type ReboundEvent = 'document.changed' | 'selection.changed' | 'commandStack.changed'`. Add `private _bus: EventEmitter<DiagramEventMap> | null = null` and `private _handlers = new Set<{ event: ReboundEvent; handler: (...args: never[]) => void }>()`. Add public `on<K extends ReboundEvent>(event: K, handler: (...args: DiagramEventMap[K]) => void)` and `off(...)` — mutate `_handlers`, and if `_bus` is bound, `_bus.on/off(event, handler)` immediately. Add `private _teardown()` = the current `destroy()` body (`:107-111`) PLUS, before nulling, detach each registered handler via the held `_bus` (`this._bus?.off(...)`) then `this._bus = null` — **keep `_handlers`**; order: `this._diagram?.destroy()` first (so teardown-observing handlers still fire), then detach. Change `destroy()` to `this._teardown(); this._handlers.clear();`. In `_boot`, change `this.destroy()` (`:116`) to `this._teardown()`, and after `new Diagram(...)` add `this._bus = this.get<EventEmitter<DiagramEventMap>>('eventBus'); this._handlers.forEach((h) => this._bus!.on(h.event, h.handler as never));`. Add `eventemitter3: ^5.0.1` to `packages/viewer/package.json` dependencies. Narrow generic per the round-6 finding (do NOT expose all of `DiagramEventMap`).

**Verification**:
`pnpm --filter @d3-polytree/viewer typecheck`; `pnpm --filter @d3-polytree/viewer test`; `pnpm lint`.

**Test**:
`packages/viewer/src/onoff.test.ts`: boot a Viewer (createEmpty), `on('document.changed', spy)`, `importDiagram(xml)` again (reboot), then drive a `document.changed` via `get('commandStack')` or a bus emit and assert the spy still fires (subscription survived the reboot). Assert `off()` after `destroy()` is a no-op (no throw). Fails before Step 1.

---

### Step 2 — Scaffold `@d3-polytree/element` (custom element skeleton)

**Status**: `pending`
**Files**:
- `packages/element/package.json` — create
- `packages/element/tsup.config.ts` — create
- `packages/element/vitest.config.ts` — create
- `packages/element/src/index.ts` — create
- `packages/element/tsconfig.json` — create

**Evidence**:
- Package template (`exports` `.`/`./umd`, `sideEffects:false`, `publishConfig.access:public`, UMD pass): `packages/editor/package.json`, `packages/editor/tsup.config.ts` (dual ESM/CJS+dts pass + `iife` UMD pass `globalName`). Vitest jsdom one-liner: `packages/editor/vitest.config.ts`.
- Host API reused: `importDiagram`/`createEmpty`/`exportDiagram`/`get`/`destroy` + `on/off` (Step 1) — `packages/viewer/src/index.ts:70,75,85,98,106`; container append contract `packages/canvas/src/Canvas.ts:11,21`.

**Instructions**:
Create the package with **direct deps** `@d3-polytree/editor`, `@d3-polytree/interactive-viewer`, `@d3-polytree/viewer` (`workspace:*`) — interactive-viewer is required for its `dist/style.css` (Step 3) and pnpm strict resolution. Mirror the editor `tsup.config.ts` (ESM+CJS+dts pass with workspace pkgs `external`; second `iife` pass `globalName: 'd3PolytreeElement'`, `noExternal:[/.*/]`, `dist/element.umd.js`). `src/index.ts`: `class D3PolytreeEditor extends HTMLElement { static formAssociated = true; static observedAttributes = ['value']; … }` — `constructor` attaches `attachShadow({ mode:'open', delegatesFocus:true })` + `this.attachInternals?.()`; `connectedCallback` sets `:host` layout, creates an inner `<div>`, `new Editor({ container: div })`, boots from `this.getAttribute('value')` (→ importDiagram) or `createEmpty()`, subscribes `editor.on('document.changed', …)` → `internals?.setFormValue?.(editor.exportDiagram())` (guarded) + `dispatchEvent(new CustomEvent('change', { detail: editor.exportDiagram() }))`; `disconnectedCallback` → `editor.destroy()`; `attributeChangedCallback('value', …)` → importDiagram; `value` getter/setter reflect. At module end: `if (!customElements.get('d3-polytree-editor')) customElements.define('d3-polytree-editor', D3PolytreeEditor)`. (CSS injection = Step 3; exportSVG wrap = Step 4.)

**Verification**:
`pnpm --filter @d3-polytree/element typecheck`; `pnpm --filter @d3-polytree/element build`; `pnpm lint`.

**Test**:
Covered by Step 4's element tests. `N/A (skeleton; behavior asserted in Step 4)`.

---

### Step 3 — Shadow CSS: `generate-styles.mjs` + committed `styles.generated.ts`

**Status**: `pending`
**Files**:
- `packages/element/scripts/generate-styles.mjs` — create
- `packages/element/src/styles.generated.ts` — create (committed)
- `packages/element/package.json` — modify (`build` runs the script before tsup)

**Evidence**:
- Precedent: `packages/icons-amazon/package.json` `build` = `node scripts/generate-icons.mjs && tsup`; committed `src/icons.generated.ts` (not gitignored — `.gitignore` ignores only `dist`/`node_modules`).
- Both stylesheets needed: `packages/editor/package.json` `./style.css` (properties/palette/drag) + `packages/interactive-viewer/package.json` `./style.css` (outline/notifications/side-tabs/search); editor consumers import both (root `CLAUDE.md` "CSS ships compiled").
- turbo `^build` ordering: `turbo.json` `build.dependsOn: ["^build"]`.

**Instructions**:
`generate-styles.mjs` (Node stdlib): `createRequire(import.meta.url)`, `require.resolve('@d3-polytree/editor/style.css')` + `require.resolve('@d3-polytree/interactive-viewer/style.css')`, read both with `readFileSync`, write `src/styles.generated.ts` exporting `export const shadowCss = ${JSON.stringify(edCss + '\n' + ivCss)};`. Set element `build` = `node scripts/generate-styles.mjs && tsup && tsup --config tsup.umd... ` (mirror editor's single `tsup` if the config array covers both passes). In `connectedCallback`, inject: if `this.shadowRoot.adoptedStyleSheets` supported, build a `CSSStyleSheet().replaceSync(shadowCss)` and assign; else append a `<style>` with `shadowCss` textContent. Commit the generated file (regenerate before commit).

**Verification**:
`pnpm --filter @d3-polytree/element build` (script runs, styles.generated.ts non-empty); `pnpm --filter @d3-polytree/element typecheck`.

**Test**:
Step 4 asserts the shadow root contains the CSS. Here: `N/A (build artifact; asserted in Step 4)`.

---

### Step 4 — Element behavior + exportSVG CSS wrap + tests

**Status**: `pending`
**Files**:
- `packages/element/src/index.ts` — modify (exportSVG wrap)
- `packages/element/src/element.test.ts` — create

**Evidence**:
- `exportSVG()` returns a complete `<svg>…</svg>` string — `packages/viewer/src/index.ts:93-95` → `Canvas.getSVGStr` → `getSvgString` (`packages/canvas/src/SvgExportingUtils.ts:9-18`); its CSS inlining reads `document.styleSheets` (`:53`), blind to shadow styles.
- jsdom `attachInternals` exists but stub lacks `setFormValue` (root `package.json` jsdom ^25) — guard on `setFormValue`.

**Instructions**:
Add an `exportSVG()` method on the element that calls `editor.exportSVG()` and, on the returned string, injects a `<style>${shadowCss}</style>` immediately after the opening `<svg …>` tag (string splice), so the exported SVG carries panel/node CSS. Write `element.test.ts` (jsdom): define the element; attach to `document.body`; assert (a) `value` property⇄attribute reflection; (b) connectedCallback creates a shadow root containing the `.pfdjs-container` div and the injected CSS (`shadowRoot.adoptedStyleSheets.length` or a `<style>`); (c) editing (drive `get('commandStack')` or emit `document.changed`) dispatches a `change` CustomEvent and calls a **shimmed** `setFormValue` spy (stub `attachInternals` to return `{ setFormValue: vi.fn() }`); (d) `setFormValue` guard does not throw when internals lack it; (e) `disconnectedCallback` tears down (container removed); (f) `exportSVG()` output contains a panel/node CSS rule.

**Verification**:
`pnpm --filter @d3-polytree/element test`; `pnpm --filter @d3-polytree/element typecheck`; `pnpm lint`.

**Test**:
This step is the element test suite. Fails before Steps 2–4.

---

### Step 5 — Scaffold `@d3-polytree/react` (React peer wrapper skeleton)

**Status**: `pending`
**Files**:
- `packages/react/package.json` — create
- `packages/react/tsup.config.ts` — create
- `packages/react/vitest.config.ts` — create
- `packages/react/tsconfig.json` — create
- `packages/react/src/index.tsx` — create

**Evidence**:
- No React anywhere today (recon); D3 peers declared narrowly `packages/core/package.json:34` — same pattern for React here.
- Host API + `on/off` (Step 1); `document.changed`/`selection.changed` (`packages/canvas/src/events.ts:104,95`); `selection.changed` tuple order `(prev, next)` — `packages/core/src/features/selection.ts:61`.

**Instructions**:
Create the package: `dependencies: { '@d3-polytree/editor': 'workspace:*' }`; `peerDependencies: { react: '>=18', 'react-dom': '>=18' }`; `devDependencies: { react: '^19', 'react-dom': '^19', '@types/react': '^19', '@types/react-dom': '^19' }`. tsup ESM+CJS+dts only (**no UMD**; React external). `src/index.tsx` begins `'use client';`. Export a `forwardRef` component `PolytreeEditor` with props `{ defaultValue?: string; onChange?: (e: { dirty: boolean; getValue: () => string }) => void; onSelectionChange?: (prev, next) => void }` and a ref handle `{ getEditor(), load(xml), export(): string }`. Do NOT add a controlled `value` prop.

**Verification**:
`pnpm --filter @d3-polytree/react typecheck`; `pnpm lint`.

**Test**:
Covered by Step 6. `N/A (skeleton)`.

---

### Step 6 — React wrapper behavior (useSyncExternalStore) + tests

**Status**: `pending`
**Files**:
- `packages/react/src/index.tsx` — modify
- `packages/react/src/react.test.tsx` — create

**Evidence**:
- `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`; `act` exported from `react` at 18.3+/19; `document.changed`/`selection.changed` (`packages/canvas/src/events.ts:104,95`).

**Instructions**:
On mount (effect), create `new Editor({ container: hostDivRef })`, boot from `defaultValue` (importDiagram) or `createEmpty`, and store a wrapper-owned monotonic `counterRef`. `subscribe(cb)`: register `cb`; `editor.on('document.changed', h)` + `editor.on('selection.changed', h2)` where the handlers bump the counter, fire `onChange({ dirty, getValue: () => editor.exportDiagram() })` / `onSelectionChange(prev, next)`, and call `cb()`. Return an unsubscribe that `editor.off(...)`. `getSnapshot = () => counterRef.current`; `getServerSnapshot = () => 0`. Ref handle: `getEditor`, `load(xml) => editor.importDiagram(xml)`, `export() => editor.exportDiagram()`. Clean up (`editor.destroy()`) on unmount. Write `react.test.tsx` using `createRoot` + `act` from `react` (jsdom): mount, assert `onChange` fires on an edit, `ref.export()` returns `.pfdn`, `ref.load()` swaps the doc, unmount destroys.

**Verification**:
`pnpm --filter @d3-polytree/react test`; `pnpm --filter @d3-polytree/react typecheck`; `pnpm lint`.

**Test**:
This step is the react test suite. Fails before Steps 5–6.

---

### Step 7 — Playwright browser form-participation test

**Status**: `pending`
**Files**:
- `apps/storybook/playwright/element-form.spec.ts` — create

**Evidence**:
- Playwright runner/config: `apps/storybook/playwright.config.ts` (pinned `@playwright/test` 1.56.1, `apps/storybook/package.json:26`), existing specs `apps/storybook/playwright/interactions.spec.ts`, `_support.ts` (reads built artifacts). VR/a11y specs loop `loadStories()` (no story ⇒ no VR/a11y enrollment).
- Built element UMD: `packages/element/dist/element.umd.js` (self-registers tag).

**Instructions**:
New spec (no Storybook story, so it stays out of the VR + a11y nets): `page.setContent('<form id="f"><d3-polytree-editor name="doc"></d3-polytree-editor></form>')` on about:blank; inject the built UMD via `page.addScriptTag({ content })` where `content` is read from a **repo-root-resolved absolute path** — Playwright's cwd is `apps/storybook` (`testDir: './playwright'`), so a bare `packages/element/...` relative path resolves wrong (W1). Resolve it as `path.resolve(__dirname, '../../../packages/element/dist/element.umd.js')` (mirror `_support.ts`'s `node:path` artifact-resolution — `_support.ts:1-2`), or `fileURLToPath` off `import.meta.url`. Wait for the element to upgrade + boot; make an edit via `page.evaluate` (dispatch through the element's editor or set a value); assert `new FormData(document.getElementById('f')).get('doc')` contains a `.pfdn` fragment. Guard the spec so it only runs when the UMD exists (build-before-e2e). Keep it a single spec.

**Verification**:
Run the Playwright suite the way CI does (container-pinned, `.github/workflows/visual-regression.yml`); locally note it needs the pinned container. `pnpm build` first (produces the element UMD).

**Test**:
This step is the browser test. Confirms real Chromium form participation (unverifiable in jsdom).

---

### Step 8 — Changesets, lockfile, README, ROADMAP

**Status**: `pending`
**Files**:
- `.changeset/custom-element-react.md` — create
- `pnpm-lock.yaml` — modify (regenerated by `pnpm install` for React devDeps)
- `README.md` — modify (mention the two new packages)
- `ROADMAP.md` — modify (mark C7)

**Evidence**:
- Changesets auto-include new packages (`.changeset/config.json` ignores only storybook); frozen install requires the committed lockfile (`.github/workflows/ci.yml`).

**Instructions**:
`pnpm install` to regenerate `pnpm-lock.yaml` (React devDeps) and commit it. Changeset: **minor** for `@d3-polytree/viewer` (new `on/off` API), `@d3-polytree/element`, `@d3-polytree/react`; plus a **patch** for `@d3-polytree/editor` describing the reboot-keydown bonus fix from Step 1 (W2 — so its changelog carries the user-visible fix, not just the dependency cascade). Add the two packages to `README.md`'s package table. Mark C7 in `ROADMAP.md`. Note (not a code step): a Trusted Publisher must be configured on npmjs.com for each new package before its first OIDC publish (root `CLAUDE.md` Releases) — release follow-up.

**Verification**:
Full gate: `pnpm install --frozen-lockfile` then `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm build-storybook`.

**Test**:
`N/A (release/docs)`.

---

## Review Log

### 2026-09-20 — plan-review — verdict: passed-with-warnings
Reviewer subagent applied the plan-review criteria and verified every cited `path:line` (all resolve).
**Blockers: none** (design honored; rejected alternatives stay rejected — adapter-side re-subscribe,
one-package-two-entries, in-package SCSS compile, controlled React `value`; host rules untouched; ordering
sound with an explicit `## Step Dependencies`). The Step-1 on/off design matches the design doc on all four
points, and the reboot-keydown bonus fix was confirmed real. **Warnings addressed (no waivers):**
- W1 (Step 7): the Playwright UMD `readFileSync` path must be repo-root-resolved (cwd is `apps/storybook`) —
  amended to `path.resolve(__dirname, '../../../packages/element/dist/element.umd.js')`.
- W2 (Step 8): added a `@d3-polytree/editor` patch changeset for the reboot-keydown fix so its changelog
  carries the user-visible change, not just the dependency cascade.
- W3 (NOTE, no change): `eventemitter3` as a `dependency` on viewer matches the sibling precedent; type-only
  use would also permit devDep — harmless.

No blockers, so no fix-and-re-review cycle required; amendments are doc-only clarity edits touching no cited
evidence. Plan is execution-ready.

## Deviation Log

- **Steps 4 & 7 — form value set on boot, not only on edit.** The element now calls its form-value
  update on initial load (`createEmpty`/`importDiagram`) as well as on `document.changed`, via a private
  `_updateFormValue()` (no `change` event) split from the edit path (`_onDocChanged` = update + emit
  `change`). This is more correct form-association semantics (a `<form>` reads the current document
  immediately) and makes the Playwright test assert boot-time form participation. The jsdom edit test was
  updated to clear the `setFormValue` spy after boot before asserting the edit call.
- **Test typing** — the element/react test files type the eventBus via a local `Bus` interface and cast
  the private `_editor` through `unknown` (a direct intersection collides with the `private` member →
  `never`), avoiding non-direct-dep type imports (`eventemitter3`/`@d3-polytree/core`) that broke
  `tsc --noEmit`.

_Step bodies above are immutable (DN-5); further divergence recorded here._
