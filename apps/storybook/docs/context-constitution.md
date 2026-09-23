# @d3-polytree/storybook — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the dev
harness / VR baseline host — the CSS layering, the dist-not-src consumption, and the title-as-lookup-key
coupling. Does not restate the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **apps/storybook**.

## Rules (`SB-*`) — binding, easy-to-miss conventions

| ID | Rule | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **SB-01** | CSS imports are **layered to the class hierarchy and ordered**: a `Viewer` story imports none, an `InteractiveViewer` story imports `interactive-viewer/style.css`, and every `Editor`-based story imports **both, interactive-viewer first then editor**. | A new Editor story with only `editor/style.css` (or reversed order) renders side-tabs/search/panel unstyled and diffs the VR baseline. | `apps/storybook/src/Editor.stories.ts`, `src/Kitchensink.stories.ts`, `src/IconsAmazon.stories.ts`, `src/InteractionHarness.stories.ts`, `src/AutoLayout.stories.ts` | `apps/storybook/src/Editor.stories.ts` |
| **SB-02** | Stories consume the built **`dist`**, never source — there is no `resolve.alias` to package `src`, and `workspace:*` deps resolve through each package's `exports` → `dist`. `pnpm build` must precede `build-storybook`/e2e. | Editing a package `src` and reloading Storybook shows stale `dist` until the upstream package is rebuilt. | `apps/storybook/.storybook/main.ts#viteFinal` (no alias) | `apps/storybook/.storybook/main.ts#viteFinal` |
| **SB-03** | `meta.title` is a **cross-file lookup key** for Playwright specs (`s.title === 'Components/Editor'`, `=== 'Tests/Interaction Harness'`). | Renaming a story's `title` silently `test.skip`s `theme.spec` and fails `interactions.spec` — with no compile error. | `apps/storybook/playwright/theme.spec.ts`, `apps/storybook/playwright/interactions.spec.ts` | `apps/storybook/playwright/interactions.spec.ts` |

## Norms (`SB-*`) — defaults & asymmetry guidance

| ID | Norm | Why | Evidence | Example (canonical `path#anchor`) |
|---|---|---|---|---|
| **SB-N04** | Component stories pass `deterministicModules()` **first** (ahead of any caller module) so DOM ids are byte-stable; a new VR-captured story should do the same. | Without it, generated ids churn and VR diffs (though ids are attributes, not pixels — the Kitchensink exception relies on that). | `apps/storybook/src/deterministic.ts#deterministicModules` (+ usage across Viewer/InteractiveViewer/Editor/AutoLayout stories) | `apps/storybook/src/deterministic.ts#deterministicModules` |

## Gotchas & scars

- **`tsc --noEmit` typechecks the Playwright specs too** (`tsconfig.json#include` lists `playwright`), so the browserless `typecheck` CI lane fails on a type error in a spec even though `test:e2e` is a separate job. Evidence: `apps/storybook/tsconfig.json`.
- **a11y is enforced via Playwright axe, not a Storybook a11y addon** — `.storybook/main.ts` declares no `addons`. Don't expect `@storybook/addon-a11y` config. Evidence: `apps/storybook/playwright/a11y.spec.ts`.

## Candidate rules (unverified)

| Candidate | Why suspected | What would confirm it |
|---|---|---|
| A new `tags: ['!autodocs']` fixture still needs a VR baseline | `_support.ts#loadStories` filters on `type === 'story'`, ignoring tags, so `!autodocs` fixtures are still screenshotted | one more fixture example confirming the pattern |

## Pointers (already documented or CI-enforced — not restated here)

| What | Where |
|---|---|
| Relative `base:'./'` for GitHub Pages subpath | `apps/storybook/.storybook/main.ts#viteFinal` |
| `auto` theme is a no-op to preserve light VR baselines; `light`/`dark` stamp `[data-pfd-theme]` | `apps/storybook/.storybook/preview.ts` |
| VR baselines container-pinned; `@playwright/test` pinned to match | `apps/storybook/playwright.config.ts`, `apps/storybook/CLAUDE.md`, root `PLAT-08` |
| `test:e2e` is deliberately outside `turbo run test` | `apps/storybook/CLAUDE.md` |

---
_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
