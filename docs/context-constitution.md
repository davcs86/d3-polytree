# d3-polytree (root) — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915` — the repo state this analysis reflects; a
later `refresh` reruns against a newer commit. This file captures the **non-obvious** — patterns this
monorepo follows but never wrote down, the contracts between packages, and the scars behind them — the
things an agent would otherwise miss and get wrong. It does **not** restate what the docs already say
or CI already enforces (see `## Pointers`). Refresh by re-running `/context-constitution`.

> **ID scheme (CF-N5).** The repo's own `O*/B*/C*/F*` ids in `ROADMAP.md` are an ADR / decision log
> (design-buddy debated → planned → reviewed), not a codebase-invariant rule scheme. This constitution
> therefore uses a sibling namespace — `PLAT-*` at the root, `<MODULE>-*` per package — and
> cross-references the decision ids where they overlap, rather than renumbering into them.

## Floor (`PLAT-*`) — never-do, non-overridable

| ID | Rule | Why | Evidence |
|---|---|---|---|
| **PLAT-01** | The DOM-notifications override module (any module that seizes an existing token) must remain the **last** entry in a component's `getModules()`. Never append a module after it. | It grabs the `notifications` token by didi last-definition-wins; anything registered after it reverts the token to core's headless console stub, which treats every `confirm` as cancelled — so palette **New/Save silently no-op**. | `packages/interactive-viewer/src/index.ts#getModules`, `packages/editor/src/index.ts#getModules`, `packages/core/src/features/notifications.ts#notificationsModule`; scar PR #70 (`8394296`) |

## Rules (`PLAT-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **PLAT-02** | Every DI-managed class declares `static readonly $inject = [...]`, and every service `*Module` binds `['type', Class]` **with `__init__: ['token']`**. | Root `CLAUDE.md` documents only the module-*descriptor* shape and the boot-order rule in the abstract. In practice: omit `$inject` → didi injects positionally and args are `undefined`; omit `__init__` → the service is only lazily created, so its constructor-time bus subscriptions (`*.created`, `commandStack.changed`) never register and initial-model elements silently drop. | `packages/canvas/src/Canvas.ts#Canvas`, `packages/core/src/draw/Nodes.ts#Nodes`, `packages/core/src/features/zoom.ts#Zoom` (N=34 `$inject` in core) | `packages/core/src/draw/Nodes.ts#Nodes` |
| **PLAT-03** | Caller/subclass `modules` are appended **after** a component's own modules and win by last-definition — **except** the `d3polytree` host value, which `_boot` pins **last** and a caller therefore cannot override. | The single extension seam is "compose after → override"; the host binding is the one deliberate carve-out (a caller can't swap the model host). Assuming a caller module can redefine `d3polytree` yields a silent "why is my override ignored" loop. | `packages/viewer/src/index.ts#_boot`, `packages/viewer/src/index.test.ts` ("lets a caller module win a token by last definition") | `packages/viewer/src/index.ts#_boot` |
| **PLAT-04** | `*.generated.ts` files are **committed source**, regenerated only by each package's `build` (`node scripts/generate-*.mjs && tsup`). Never hand-edit, never gitignore. `typecheck`/`test` import them but do **not** regenerate — deleting one breaks those lanes. | The generate step runs only under `build`; unit lanes assume the committed artifact is present and fresh. | `packages/pfdn-moddle/scripts/generate-pfdn.mjs`, `packages/icons-amazon/scripts/generate-icons.mjs`, `packages/element/scripts/generate-styles.mjs` | `packages/icons-amazon/src/icons.generated.ts` (do-not-edit header) |
| **PLAT-05** | A component's **library-pass** tsup `external` array must list its parent workspace package(s) so they stay external (not inlined). The **UMD second pass** deliberately inlines everything via a `noExternal` catch-all. | Keeps the ESM/CJS build thin for consumers who dedupe workspace deps, while the UMD drop-in is self-contained (decision O8). | `packages/viewer/tsup.config.ts#external` (→ core), `packages/interactive-viewer/tsup.config.ts#external` (→ viewer+core+…) | `packages/interactive-viewer/tsup.config.ts#external` |
| **PLAT-06** | Output determinism (element ids **and** serialized SVG) is a repo-wide contract: it rests on `SequentialIdGenerator` + a fixed drawer boot order, and is consumed by `@d3-polytree/ssr` and every visual-regression baseline. Never introduce `Math.random`, `Date`, or `Map`/`Set` iteration-order into a render or id path. | A single nondeterministic tie-break churns SSR golden files and fails the C8 VR net. | `packages/canvas/src/IdGenerator.ts#SequentialIdGenerator`, `packages/ssr/src/renderToSvg.test.ts` ("is deterministic"), `packages/layout/src/order.ts#reorderByMedian` | `packages/canvas/src/IdGenerator.ts#SequentialIdGenerator` |
| **PLAT-07** | Changesets is configured `updateInternalDependencies: patch`, so a bump to a base package (canvas/core) **cascades a patch bump up the entire subclass chain** on release. A changeset that touches only one package still ships bumped dependents. | Reasoning about release scope from the single changed package undercounts what publishes. | `.changeset/config.json#"updateInternalDependencies"` | `.changeset/config.json` |
| **PLAT-08** | The Playwright runner image is byte-locked to `@playwright/test`; bump both together or the VR baselines break. | Baselines are pixel-pinned to one container/browser build. | `.github/workflows/visual-regression.yml#PLAYWRIGHT_IMAGE`, `apps/storybook/package.json#"@playwright/test"` | `.github/workflows/visual-regression.yml` |

## Norms (`PLAT-*`) — defaults & asymmetry guidance

| ID | Norm | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **PLAT-N09** | Treat diagram transforms as **always translate + scale, never rotation/skew**: follow `Canvas.getTransform`, which normalizes only `a/d/e/f`, and `zoom.ts`, which only ever writes `translate(...) scale(...)`. | The engine consistently narrows to translate+scale; a rotate/skew would be silently dropped by `getTransform` (recorded as a latent-narrowing finding, not yet a bug in practice). | `packages/canvas/src/Canvas.ts#getTransform`, `packages/core/src/features/zoom.ts#Zoom` | `packages/canvas/src/Canvas.ts#getTransform` |

## Gotchas & scars

- **UI chrome icons are inline Lucide SVG vendored in core (`packages/core/src/uiIcons.ts`, `createIcon`/`UiIconName`), never an icon font.** Palette / side-tabs / panel-close take a semantic `icon` key, not a CSS `iconClassName`. Scar PR #69 (`ca348c6`) replaced a resurrected 2017 fontello `pfdn-font` with this — don't reintroduce an icon font for chrome. Evidence: `packages/core/src/uiIcons.ts`, PR #69.
- **Link waypoints are routed at *load* (`loadModel`), not only on drag,** via the draw-independent `packages/core/src/modelling/linkRouting.ts`; `ModellingLinks` reuses the same pure geometry for drag re-routing. Wrong move: routing only on drag → links paint centre-to-centre straight lines on first load and in the static `Viewer`. Scar PR #69 (`ca348c6`).
- **Publishing is pinned to pnpm 10 for OIDC** (pnpm 9 has no OIDC; pnpm 11 has an OIDC 404 regression). Already in root `CLAUDE.md` Releases — pointer, not re-litigated here. Scar PR #53 (`0d58f97`).

## Candidate rules (unverified)

| Candidate | Why suspected | What would confirm it |
|---|---|---|
| Terminal components (`viewer`/`interactive-viewer`/`editor`/`element`) should declare core's 6 D3 slices as `peerDependencies` | core declares them as peers but no terminal component does; npm won't auto-install peers of a transitive dep, so a bare `npm i @d3-polytree/editor` may not surface the D3 slices | Read each component README's Install section + confirm whether consumers actually get the peers transitively; if not, it's a packaging fix (findings) |

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| didi "last-definition-of-a-token-wins" + boot-order = event-subscription order + caller-modules-appended-after | root `CLAUDE.md#Dependency injection (didi)` |
| Cross-package tests read built `dist`, not source | root `CLAUDE.md#Gotchas` |
| CSS ships compiled to `dist/style.css`; UMD is a second tsup pass | root `CLAUDE.md#Gotchas` |
| Release/OIDC/pnpm-10 pin, hybrid publish routing | root `CLAUDE.md#Releases`, `scripts/publish.mjs#registryHasPackage` |
| CI order install→lint→typecheck→test→build→build-storybook | root `CLAUDE.md#Commands`, `.github/workflows/ci.yml` |
| Package READMEs follow the shared template; README-only edits need a `patch` changeset | root `CLAUDE.md#Package READMEs`, `docs/README-template.md` |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
