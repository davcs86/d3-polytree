# @d3-polytree/icons-amazon

An **AWS icon pack** for [d3-polytree](https://github.com/davcs86/d3-polytree), and the **reference
implementation of the icon-pack convention**. Compose it into any component to render nodes as AWS
service symbols — and use it as the template for authoring your own pack.

**[▶ Live demo](https://davcs86.github.io/d3-polytree/?path=/story/icon-packs-amazon--aws-topology)** in Storybook.

## Install

```sh
pnpm add @d3-polytree/icons-amazon
```

Ships ESM + CJS + `.d.ts`. `@d3-polytree/core` is a regular workspace dependency, kept **external** at
build (consumers resolve their own copy) — not bundled into `dist`.

## The icon-pack convention

An icon pack is **just a didi module** whose `icons` factory spreads the engine's base icons and then
its own. Composed **after** the core modules (via the `modules` option), it extends the node-icon set
without replacing the defaults — the same last-definition-wins seam every extension uses:

```ts
import { Editor } from '@d3-polytree/editor';
import { awsIconsModule } from '@d3-polytree/icons-amazon';

const editor = new Editor({ container, modules: [awsIconsModule] });
// nodes typed e.g. `Storage_AmazonS3` now render the AWS symbol;
// the default fallback icon stays intact for every other type.
```

A node draws as a `<use>` of an SVG symbol keyed by its `type`, so the icon pack's job is simply to
contribute more `type -> <symbol>` entries to the engine's icon map.

## Authoring your own pack

Mirror this package: a module whose `icons` factory returns `{ ...createIcons(), ...yourSvgMap }`.

```ts
import { createIcons } from '@d3-polytree/core';

export const myIconsModule = {
  icons: ['factory', function () {
    return { ...createIcons(), MyType_Thing: '<symbol …>…</symbol>' };
  }]
};
```

## Scope & the full catalogue

A curated subset (8 icons) is bundled in `src/svg/`; the full ~300-icon AWS catalogue is preserved in
`catalog/` as raw assets (**not** bundled, to keep the published package small). Add the icons you need
by copying them from `catalog/` into `src/svg/` and regenerating — each file becomes a node `type`
keyed by its **filename**, so the `catalog/` filenames are the `type` strings you'll reference:

```sh
cp catalog/Storage_AmazonS3_bucket.svg src/svg/   # copy the icons you want
pnpm --filter @d3-polytree/icons-amazon generate
```

> Note: the 8 curated `src/svg/` icons were hand-renamed and are **not** a key-for-key subset of
> `catalog/`, so copying catalogue files adds new `type` keys rather than replacing the curated ones.

The build regenerates `src/icons.generated.ts` from `src/svg/` via `scripts/generate-icons.mjs`.

## Exports

- `awsIconsModule` — the didi module to compose into a component.
- The generated icon map (`src/icons.generated.ts`) is the data behind it.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo · AWS Architecture Icons are © Amazon Web Services, subject to the
[AWS trademark/asset guidelines](https://aws.amazon.com/architecture/icons/).
