---
"@d3-polytree/layout": patch
---

Robustness: `resolveOptions` clamps out-of-range values (negative/NaN spacing and negative iteration
counts) to sane minimums, and `WorkerLayoutRunner` takes a `timeoutMs` (default 30000) that rejects a
hung or crashed worker instead of leaving the promise pending forever.
