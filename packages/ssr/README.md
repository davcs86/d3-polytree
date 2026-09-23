# @d3-polytree/ssr

**Server-side rendering** for [d3-polytree](https://github.com/davcs86/d3-polytree): turn a `.pfdn`
document into a standalone **SVG string in Node**, without a real browser. `renderToSvg` hosts a
read-only [`@d3-polytree/viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/viewer)
against a jsdom DOM, wired to a deterministic id generator so the output is **reproducible** — the
basis for golden-file / visual-regression tests, thumbnails, and OG images.

## Install

```sh
pnpm add @d3-polytree/ssr
```

Ships ESM + CJS + `.d.ts`. The `@d3-polytree/*` engine packages (`viewer`, `core`, `canvas`) are
bundled into `dist`; `jsdom` is a regular runtime dependency (installed, not bundled). **No D3 peer
deps** to add, since it renders entirely in Node.

## Usage

```ts
import { renderToSvg } from '@d3-polytree/ssr';

const svg = await renderToSvg(pfdnXmlString);
// -> "<svg …>…</svg>"  (deterministic: same input → identical output)
```

Opt back into random ids (matching a live browser session) by passing your own generator:

```ts
import { renderToSvg } from '@d3-polytree/ssr';
import { IdsIdGenerator } from '@d3-polytree/canvas';

const svg = await renderToSvg(pfdnXmlString, { idGenerator: new IdsIdGenerator() });
```

## Notes & constraints

- **Deterministic by default.** Ids are minted sequentially (`node_1`, `node_2`, …) and author-set
  ids are preserved — so serialized output is byte-for-byte stable across runs and machines.
- **Serial only.** Rendering installs a jsdom onto `globalThis` for the duration of one render, so
  concurrent `renderToSvg` calls are **queued** by a module-level mutex, not run in parallel. Batch
  work with `for await`, not `Promise.all`.
- **SVG only, geometrically flat.** jsdom has no real layout engine (`getBBox` → zero box, transforms
  → identity — these are intentional engine shims), so output is reproducible but does not reflect
  measured text/element bounds. **PNG export is browser-only and out of scope.**

## API

`renderToSvg(xml: string, options?: { idGenerator?: IdGenerator }) => Promise<string>`

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
