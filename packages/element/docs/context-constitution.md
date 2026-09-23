# @d3-polytree/element — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the
`<d3-polytree-editor>` custom element — degrade-gating, lifecycle idempotency, and the reboot-surviving
subscription. Does not restate the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/element**.

## Rules (`ELEMENT-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **ELEMENT-01** | Every DOM/engine capability that jsdom or an old browser may lack is **feature-gated (try/catch or `typeof`/`in` check) and degrades silently** — `attachInternals?.()` in try/catch, `'adoptedStyleSheets' in root` else `<style>` fallback, `typeof setFormValue === 'function'`, `typeof customElements !== 'undefined'`. | Calling these directly (as MDN examples do) throws under jsdom and the folded test suite, breaking the "degrades gracefully" contract. | `packages/element/src/index.ts#constructor`, `#_injectStyles`, `#_updateFormValue`, `#defineD3PolytreeEditor` | `packages/element/src/index.ts#_injectStyles` |
| **ELEMENT-02** | Lifecycle handlers are **idempotency-guarded** against repeated invocation: `connectedCallback` early-returns `if (this._editor)`, `define` guards on `customElements.get(TAG)`, and `_onDocChanged` is a single stored arrow bound once so `off()` can detach it. | Re-booting the Editor on every `connectedCallback` (reconnect/move) or re-`define`-ing on HMR double-mounts / throws `NotSupportedError`. | `packages/element/src/index.ts#connectedCallback`, `#defineD3PolytreeEditor` | `packages/element/src/index.ts#connectedCallback` |
| **ELEMENT-03** | The element subscribes via `editor.on('document.changed', …)` **because that is a `ReboundEvent`** (it survives `importDiagram` reboots — `VIEWER-02`). Switching to a raw `eventBus`/`element.*` event silently dies on the first document reload. | The subscription must ride the re-attach set, or all `change`/form updates drop after a `load()`. | `packages/element/src/index.ts#connectedCallback`, `packages/viewer/src/index.ts#ReboundEvent` | `packages/element/src/index.ts#connectedCallback` |

## Norms (`ELEMENT-*`) — defaults & asymmetry guidance

| ID | Norm | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **ELEMENT-N04** | `_updateFormValue` sets `_lastEmitted = xml` **before** `setAttribute('value', xml)`, so the resulting `attributeChangedCallback` sees `value === _lastEmitted` and skips the reload — a deliberate self-echo guard. | Reordering the two lines causes an **infinite import loop**. | `packages/element/src/index.ts#_updateFormValue`, `#attributeChangedCallback` | `packages/element/src/index.ts#_updateFormValue` |

## Gotchas & scars

- **`exportSVG()` re-injects `shadowCss` and stamps `data-pfd-theme="light"`** because the engine's export inlines CSS from `document.styleSheets`, which cannot see the shadow root. It is **not idempotent** across repeated calls on one live instance (the engine appends a `<style>` each call) — the test asserts theme-invariance across two *fresh* instances. Evidence: `packages/element/src/index.ts#exportSVG`, `packages/element/src/element.test.ts`.
- **`observedAttributes` lists only `value`; `name` is left to the browser's form machinery** (`ElementInternals.setFormValue` submits under the host's `name`). Adding `name` handling duplicates the browser. Evidence: `packages/element/src/index.ts#observedAttributes`.

## Candidate rules (unverified)

| Candidate | Why suspected | What would confirm it |
|---|---|---|
| `@d3-polytree/viewer` is an unused direct dependency | never imported by `src/` (only `@d3-polytree/editor` is) | check whether the emitted `dist/index.d.ts` references `Viewer` types requiring the package to resolve |

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| Styling inlined into shadow root via `styles.generated.ts` (generated, do-not-edit) | `packages/element/src/styles.generated.ts` header, `scripts/generate-styles.mjs`, root `PLAT-04` |
| Two-pass tsup (external lib build + self-contained UMD, decision O8) | `packages/element/tsup.config.ts` header |
| Form-association / graceful-degrade / `tabindex`+`delegatesFocus` | `packages/element/README.md#API`, `### Inside a <form>` |
| Cross-package tests read built `dist` | root `CLAUDE.md#Gotchas` |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
