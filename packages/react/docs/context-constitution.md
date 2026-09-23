# @d3-polytree/react — Constitution

Derived by `/context-constitution` (context-forge) on 2026-09-23 from branch
`claude/context-forge-setup-sg442w` at commit `89de915`. Captures the **non-obvious** for the React
wrapper — the `useSyncExternalStore` bridge whose whole design hinges on a stable scalar snapshot. Does
not restate the docs or CI (see `## Pointers`).

> Inherits all rules of the root constitution (`../../docs/context-constitution.md`). This file lists
> only what is specific to **@d3-polytree/react**.

## Rules (`REACT-*`) — binding, easy-to-miss conventions

| ID           | Rule                                                                                                                                                                                                                                                    | Why                                                                                                                                                                                                                  | Evidence                                                      | Example (canonical `path#anchor`)          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| **REACT-01** | The `useSyncExternalStore` snapshot **must be the monotonic primitive counter** (`store.counter`, a number), never a fresh/derived object. The store is created once via a ref-null guard; `subscribe`/`getSnapshot` are `useCallback([store])`-stable. | Returning a new reference every call → `useSyncExternalStore` sees a "changed" snapshot on every render → **infinite re-render loop**. The design hinges on a stable, incrementing scalar.                           | `packages/react/src/index.tsx#getSnapshot`, `#bump`, `#Store` | `packages/react/src/index.tsx#getSnapshot` |
| **REACT-02** | Callbacks are **latest-props-via-ref**: `cbRef.current` is reassigned during render and the event-bus effect (deps `[]`) reads `cbRef.current.onChange?.(…)`.                                                                                           | Putting `onChange`/`onSelectionChange` in the effect dep array (the "obvious" fix) tears down and rebuilds the `Editor` on every parent re-render with a new inline handler — destroying undo history and selection. | `packages/react/src/index.tsx#cbRef`, `#useEffect`            | `packages/react/src/index.tsx#useEffect`   |

## Norms (`REACT-*`) — defaults & asymmetry guidance

| ID            | Norm                                                                                 | Why                                                                                                                                                                                 | Evidence                                        | Example (canonical `path#anchor`) |
| ------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| **REACT-N03** | **No UMD pass** (ESM + CJS + d.ts only) — deliberately, unlike the other components. | A UMD React build needs React as an external global and is "materially more fragile"; the config comment says it is skipped by design. Adding one for symmetry reverses a decision. | `packages/react/tsup.config.ts` (+ doc comment) | `packages/react/tsup.config.ts`   |

## Gotchas & scars

- **`'use client'` at the top is load-bearing for RSC/Next App Router** consumers and easy to strip as "unused." Evidence: `packages/react/src/index.tsx` (line 1).
- **The `useSyncExternalStore(...)` return value is intentionally discarded** — subscribing is what keeps React in sync; an agent may "clean up" the seemingly-dead hook call. Evidence: `packages/react/src/index.tsx` (comment above the call).

## Candidate rules (unverified)

| Candidate                                                                                          | Why suspected                                                                                                   | What would confirm it                                         |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| The `react >= 18` peer floor is the `useSyncExternalStore` minimum (not arbitrary)                 | `useSyncExternalStore` ships in React 18; peer is `>=18`, devDep pins `^19`                                     | confirm there is no React 17 fallback shim                    |
| `exhaustive-deps` is intentionally omitted repo-wide (the `[]` deps rest on a comment, not a lint) | `eslint.config.js` has no `react-hooks` rule; adding it and "fixing" deps would break the uncontrolled contract | confirm the omission is deliberate before enabling the plugin |

## Pointers (already documented or CI-enforced — not restated here)

| What                                                                              | Where                                                                                       |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Uncontrolled by design; `defaultValue` seeds once; imperative ref for reloads     | `packages/react/src/index.tsx` docstring, `packages/react/README.md#Uncontrolled by design` |
| Reboot-surviving `on`/`off` surface (`document.changed` etc. are `ReboundEvent`s) | `packages/viewer/CLAUDE.md`, root `VIEWER-02`                                               |
| README template / absolute `/tree/main/` links / patch-changeset-on-README-edit   | root `CLAUDE.md#Package READMEs`                                                            |

---

_Forged by [context-forge](https://github.com/davcs86/agent-plugins). It captures the
non-obvious — nothing here is invented; re-run `/context-constitution` to refresh after the code changes._
