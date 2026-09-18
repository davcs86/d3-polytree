# CLAUDE.md — @d3-polytree/layout

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

Framework-free layered (Sugiyama) auto-layout. **No DOM, no D3, no deps** — keep it
that way; it is what makes the solver unit-testable and Worker-hostable.

- **Abstract axes.** The whole pipeline works in _rank_ (which layer) / _order_
  (position within a layer) space; `layout.ts` projects to x/y for the four
  `direction`s at the very end. Add algorithm code in rank/order terms, never in
  x/y — that is what keeps all four directions on one code path.
- **Pipeline** (`internal.ts` → `order.ts` → `coordinates.ts`, orchestrated by
  `layout.ts`): cycle-break (reverse back-edges) → longest-path ranking → dummy
  chains for edges spanning >1 rank → median + transpose crossing reduction →
  barycenter targets snapped by weighted isotonic (PAV) regression so nodes never
  overlap. Dummies carry heavy coordinate weight so long edges run straight.
- **Determinism is a contract.** Stable ties everywhere, no randomness. The C8
  visual-regression net depends on identical output per input; do not introduce
  `Math.random`, `Date`, or Set/Map iteration-order assumptions that could vary.
- **Worker split.** `protocol.ts` holds the pure `handleLayoutRequest` + the
  transferable `Float64Array` encode/decode (test these, not `self`). `worker.ts`
  is a thin `self.onmessage` wrapper (the `./worker` build entry). `runner.ts` has
  the main-thread `LayoutRunner` (sync default + `WorkerLayoutRunner`).
- Two tsup entries (`index`, `worker`); nothing is externalised.
