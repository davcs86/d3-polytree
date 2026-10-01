---
'@d3-polytree/layout': minor
---

The `./worker` entry posts a `polytree:layout:error` response
(`LayoutErrorResponse`, built with the new `encodeError`) when the solver throws.
`WorkerLayoutRunner.run()` then rejects with that error's name and message
instead of timing out.
