# @d3-polytree/ssr

Render a `.pfdn` document to a standalone **SVG string in Node**, without a real browser.

`renderToSvg` hosts a read-only [`@d3-polytree/viewer`](../viewer) against a jsdom DOM, wired to a
deterministic id generator so the output is **reproducible** — the basis for golden-file /
visual-regression tests, thumbnails, and OG images.

```ts
import { renderToSvg } from '@d3-polytree/ssr';

const svg = await renderToSvg(pfdnXmlString);
// -> "<svg …>…</svg>"  (deterministic: same input → identical output)
```

## Notes

- **Deterministic by default.** Ids are minted sequentially (`node_1`, `node_2`, …) and author-set
  ids are preserved; pass `{ idGenerator: new IdsIdGenerator() }` to opt back into random ids.
- **Serial only.** Rendering installs a jsdom onto `globalThis` for the duration of one render, so
  concurrent `renderToSvg` calls are queued (a module-level mutex), not run in parallel.
- **SVG only.** jsdom has no real layout engine (`getBBox` → zero box, transforms → identity — these
  are intentional engine shims), so output is reproducible but geometrically flat. PNG export is
  browser-only and out of scope.
