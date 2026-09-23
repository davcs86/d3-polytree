<!-- context-forge:behavioral-contract:start -->
## How to Act

1. **Don't assume — ask, and surface tradeoffs.** *(enforced by `ELEMENT-03` — subscribe via the `document.changed` ReboundEvent; `PLAT-03`)*
2. **Write the minimum that solves the stated problem.**
3. **Touch only what the task requires; keep diffs surgical.** *(enforced by `ELEMENT-01` degrade-gating + `ELEMENT-02` lifecycle idempotency + `ELEMENT-N04` set `_lastEmitted` before `setAttribute`; `PLAT-04`)*
4. **Define success up front, then loop until verified.** *(enforced by `PLAT-06` determinism; cross-package tests read built `dist`)*
<!-- context-forge:behavioral-contract:end -->

<!-- context-forge:constitution-pointer:start -->
> 📜 **Constitution:** [`docs/context-constitution.md`](docs/context-constitution.md) · defects: [`docs/context-constitution-findings.md`](docs/context-constitution-findings.md) · inherits the root constitution. Forged by context-forge.
<!-- context-forge:constitution-pointer:end -->

# CLAUDE.md — @d3-polytree/element

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture and the DI/reboot invariants.

The `<d3-polytree-editor>` custom element: shadow DOM, form-associated (`ElementInternals`), wrapping
`@d3-polytree/editor` with no engine fork. The non-obvious invariants (feature-gated degradation,
lifecycle idempotency, the reboot-surviving subscription, and the self-echo write ordering) are in the
constitution above.
