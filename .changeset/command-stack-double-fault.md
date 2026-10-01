---
'@d3-polytree/core': minor
---

When a failed `execute` cannot be fully unwound (a double fault), `CommandStack`
now emits `document.inconsistent`, where `cause` is the original error and
`causes` holds the unwind errors. It still rethrows the original error, and the
stack stays live. Previously the unwind errors were swallowed.
