# d3-polytree (v2 monorepo)

Monorepo for the **`@d3-polytree/*`** v2 ecosystem — an interactive
[polytree](https://en.wikipedia.org/wiki/Polytree) / process-flow diagram toolkit built on slim,
modular **D3 v7**. TypeScript, ESM-first, published to npm.

> **v1** (the legacy `SimpleNetwork` viewer) remains maintained on the **`master`** branch. This
> **`v2`** branch is the modernized, TypeScript monorepo. See [`ROADMAP.md`](./ROADMAP.md) for the
> full modernization plan and the decisions log (O1–O10).

## Packages

| Package | Role |
| --- | --- |
| [`@d3-polytree/canvas`](./packages/canvas) | Base SVG canvas toolbox (`Canvas`, `ElementRegistry`, `ElementBuilder`, SVG export). |
| [`@d3-polytree/pfdn-moddle`](./packages/pfdn-moddle) | Read/write the `.pfdn` (Process Flow Diagram Notation) XML model. |
| [`@d3-polytree/core`](./packages/core) | The engine: `draw` + `features` + `modelling`, on modular D3 v7 peer deps. |
| [`@d3-polytree/viewer`](./packages/viewer) | Static, read-only viewer. |
| [`@d3-polytree/interactive-viewer`](./packages/interactive-viewer) | Viewer + pan/zoom, selection, side-tabs & search panels. |
| [`@d3-polytree/editor`](./packages/editor) | Full editor — create/modify diagrams, palette, properties panel. |
| [`@d3-polytree/icons-amazon`](./packages/icons-amazon) | AWS icon pack + the reference **icon-pack convention**. |

Every package ships **ESM + CJS + `.d.ts`**; the three components (`viewer`, `interactive-viewer`,
`editor`) also ship a self-contained **UMD** bundle with D3 inlined for a plain `<script>` drop-in.

## Install

```sh
# a component pulls in @d3-polytree/core; add the D3 v7 slices it peers on:
pnpm add @d3-polytree/editor d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag
```

## Quick start

```ts
import { Editor } from '@d3-polytree/editor';
import '@d3-polytree/interactive-viewer/style.css'; // side-tabs + search panels
import '@d3-polytree/editor/style.css';             // properties panel

const editor = new Editor({ container: document.getElementById('app')! });
await editor.createDiagram();          // or: await editor.importDiagram(pfdnXml)
const node = editor.createNode({ type: 'default', position: { x: 80, y: 80 } });
editor.select(node);
const xml = editor.exportDiagram();    // serialize back to .pfdn
```

## Extending

Compose your own didi modules through the `modules` option — they layer over the component's own,
last definition wins (no subclassing):

```ts
import { Editor } from '@d3-polytree/editor';
import { awsIconsModule } from '@d3-polytree/icons-amazon';

// a custom feature reacting to the event bus
const auditModule = {
  __init__: ['audit'],
  audit: ['type', class Audit {
    static $inject = ['eventBus'];
    constructor(bus) { bus.on('selection.changed', (_p, next) => console.log(next.length, 'selected')); }
  }]
};

new Editor({ container, modules: [awsIconsModule, auditModule] });
```

The Storybook **Guides/Kitchensink** story shows a custom feature module, a custom node-type drawer,
and the programmatic API end to end.

## `<script>` (UMD) usage

```html
<script src="https://cdn.jsdelivr.net/npm/@d3-polytree/editor/dist/editor.umd.js"></script>
<script>
  const editor = new d3PolytreeEditor.Editor({ container: document.body });
  editor.createDiagram();
</script>
```

## Monorepo / toolchain

- **pnpm** workspaces · **Turborepo** task graph · **Changesets** releases
- **TypeScript** (strict) · **tsup** builds (ESM + CJS + `.d.ts`, plus UMD for the components)
- **Vitest** (jsdom) · **ESLint** (flat) + **Prettier** · **dart-sass** for panel CSS
- **Storybook** (`@storybook/html-vite`) — dev harness, visual-regression baseline, docs site

```sh
pnpm install
pnpm build            # turbo run build
pnpm test             # turbo run test (vitest)
pnpm typecheck        # turbo run typecheck (tsc --noEmit)
pnpm lint             # eslint .
pnpm storybook        # Storybook dev server
pnpm build-storybook  # static Storybook build
pnpm changeset        # record a version bump
```

## Releases

Versioning and publishing are automated with **Changesets** + the `Release` GitHub Actions workflow.
Publishing is **tokenless** via npm **Trusted Publishing (OIDC)** — no long-lived npm token. Merge a
changeset to `v2`, merge the generated **Version Packages** PR, and the changed packages publish
themselves.

## License

MIT
