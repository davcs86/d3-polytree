# d3-polytree (v2 monorepo)

Monorepo for the **`@d3-polytree/*`** v2 ecosystem — an interactive
[polytree](https://en.wikipedia.org/wiki/Polytree) / process-flow diagram toolkit built on modular
D3. See [`ROADMAP.md`](./ROADMAP.md) for the full modernization plan and decisions log.

> **v1** (the legacy `SimpleNetwork` viewer) remains maintained on the **`master`** branch. This
> `v2` branch is the modernized, TypeScript, ESM-first monorepo.

## Layout

```
packages/
  canvas/     @d3-polytree/canvas   base SVG canvas toolbox   (scaffold placeholder)
apps/
  storybook/  dev harness · visual-regression baseline · docs site
```

The companion sources (`d3-polytree@v2.0-beta`, `d3-canvas`, `pfdn-moddle`, the search/side-tabs/
properties panels, and the AWS icon pack) are imported into `packages/*` in Track B phase **B1**
via history-preserving `git filter-repo`; this scaffold (**B0**) wires the toolchain only.

## Toolchain

- **pnpm** workspaces · **Turborepo** task graph · **Changesets** releases
- **TypeScript** (strict) · **tsup** library builds (ESM + CJS + `.d.ts`)
- **Vitest** (jsdom) · **ESLint** (flat) + **Prettier**
- **Storybook** (`@storybook/html-vite`)

## Commands

```sh
pnpm install
pnpm build            # turbo run build (tsup per package)
pnpm test             # turbo run test  (vitest)
pnpm typecheck        # turbo run typecheck (tsc --noEmit)
pnpm lint             # eslint .
pnpm storybook        # run Storybook dev server
pnpm build-storybook  # static Storybook build
pnpm changeset        # record a version bump
```

Requires Node ≥ 20 and pnpm (via `corepack enable`).
