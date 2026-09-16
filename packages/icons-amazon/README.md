# @d3-polytree/icons-amazon

An **AWS icon pack** for d3-polytree, and the reference implementation of the **icon-pack
convention**.

An icon pack is just a didi module whose `icons` factory spreads the engine's base icons and then its
own. Composed *after* the core modules (via the `modules` option), it extends the node-icon set
without replacing the defaults:

```ts
import { Editor } from '@d3-polytree/editor';
import { awsIconsModule } from '@d3-polytree/icons-amazon';

const editor = new Editor({ container, modules: [awsIconsModule] });
// nodes typed e.g. `Storage_AmazonS3` now render the AWS symbol; the default fallback stays intact.
```

**Scope.** A representative subset (8 icons) is bundled in `src/svg/`; the full ~300-icon AWS
catalogue is preserved in `catalog/` (raw assets, not bundled). Promote the full set with
`cp catalog/*.svg src/svg/ && pnpm --filter @d3-polytree/icons-amazon generate` — no code change. The
build regenerates `src/icons.generated.ts` from `src/svg/` via `scripts/generate-icons.mjs`.

Author your own pack the same way — a module that spreads `createIcons()` then your SVG map.

Part of the [d3-polytree](https://github.com/davcs86/d3-polytree) monorepo.

## License

MIT
