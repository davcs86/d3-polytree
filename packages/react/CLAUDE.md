<!-- context-forge:behavioral-contract:start -->

## How to Act

1. **Don't assume — ask, and surface tradeoffs.** _(enforced by `PLAT-03`)_
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** _(enforced by `REACT-01` — stable scalar snapshot; `REACT-02` — latest-props-via-ref, effect deps `[]`)_
4. **Define success up front, then loop until verified.** _(enforced by `REACT-N03` — no UMD pass by design)_

<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->

> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · inherits the root constitution. Forged by context-forge.

<!-- context-forge:constitution-pointer:end -->

# CLAUDE.md — @d3-polytree/react

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

A thin React wrapper around `@d3-polytree/editor` bridging the engine event bus into React via
`useSyncExternalStore`. The whole design hinges on a **stable, incrementing scalar snapshot** and
**latest-props-via-ref** — see the constitution above before touching the store or the mount effect.
