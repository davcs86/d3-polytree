# @d3-polytree/ssr

**Server-side rendering** for [d3-polytree](https://github.com/davcs86/d3-polytree): turn a `.pfdn`
document into a standalone **SVG string in Node**, without a real browser. Part of the ecosystem — it
hosts a read-only [`@d3-polytree/viewer`](https://github.com/davcs86/d3-polytree/tree/main/packages/viewer)
against a jsdom DOM, wired to a deterministic id generator so the output is **reproducible** — the basis
for golden-file / visual-regression tests, thumbnails, and OG images.

## Install

```sh
pnpm add @d3-polytree/ssr
```

**No peer dependencies** — it renders entirely in Node. The `@d3-polytree/*` engine packages (`viewer`,
`core`, `canvas`) are bundled into `dist`; `jsdom` is a regular runtime dependency (installed, not
bundled). No D3 v7 slices to add.

## What's inside

| Export | Kind | Role |
| --- | --- | --- |
| `renderToSvg` | function | `renderToSvg(xml, options?)` → `Promise<string>` — the deterministic `.pfdn` → SVG renderer. |
| `SequentialIdGenerator` | class | The default deterministic id generator (`node_1`, `node_2`, …). |
| `IdsIdGenerator` | class | The random/browser-style id generator, to opt back into non-deterministic ids. |
| `IdGenerator` | type | The id-generator interface (re-exported from `@d3-polytree/canvas`). |

## Usage

```ts
import { renderToSvg } from '@d3-polytree/ssr';

const svg = await renderToSvg(pfdnXmlString);
// -> "<svg …>…</svg>"  (deterministic: same input → identical output)
```

Opt back into random ids (matching a live browser session) by passing your own generator:

```ts
import { renderToSvg } from '@d3-polytree/ssr';
import { IdsIdGenerator } from '@d3-polytree/ssr';

const svg = await renderToSvg(pfdnXmlString, { idGenerator: new IdsIdGenerator() });
```

## API

| Symbol | Signature | Description |
| --- | --- | --- |
| `renderToSvg` | `(xml: string, options?: { idGenerator?: IdGenerator }) => Promise<string>` | Render a `.pfdn` document to a standalone SVG string. Defaults to a `SequentialIdGenerator`. |

## Notes & constraints

- **Deterministic by default.** Ids are minted sequentially and author-set ids are preserved, so
  serialized output is byte-for-byte stable across runs and machines.
- **Serial only.** Rendering installs a jsdom onto `globalThis` for the duration of one render, so
  concurrent `renderToSvg` calls are **queued** by a module-level mutex, not run in parallel. Batch
  work with `for await`, not `Promise.all`.
- **SVG only, geometrically flat.** jsdom has no real layout engine (`getBBox` → zero box, transforms
  → identity — these are intentional engine shims that live in `core`/`canvas`), so output is
  reproducible but does not reflect measured text/element bounds. **PNG export is browser-only and out
  of scope.**

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
