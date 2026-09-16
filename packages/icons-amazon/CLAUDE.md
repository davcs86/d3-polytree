# CLAUDE.md — @d3-polytree/icons-amazon

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

An AWS icon pack **and** the reference implementation of the icon-pack convention.

- `awsIconsModule.icons` is a `['factory', …]` that returns `{ ...createIcons(), ...awsIcons }` — it
  spreads the engine defaults then its own, so composing it **after** core (via the `modules` option)
  extends the icon set without dropping the defaults.
- **Generated code:** `src/icons.generated.ts` is written by `scripts/generate-icons.mjs` from every
  SVG in `src/svg/` — do not edit it by hand. Regenerate with `pnpm --filter @d3-polytree/icons-amazon
  generate` (the `build` script runs it first).
- **Scope:** only the SVGs in `src/svg/` are bundled. `catalog/` holds the full ~300-icon AWS set (raw
  assets, **eslint-ignored**, not bundled). Promote icons with `cp catalog/<name>.svg src/svg/ && pnpm
  --filter @d3-polytree/icons-amazon generate` — no code change.
- A node renders a pack icon when its `type` matches an icon key (e.g. `type: "Storage_AmazonS3"`).
