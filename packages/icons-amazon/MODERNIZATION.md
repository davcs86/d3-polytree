# @d3-polytree/icons-amazon — modernization status

**Modernized (Track B / B6).** Converted from the 2017 webpack/svg-inline-loader bundle to a
**TypeScript + ESM icon-pack package**, and the reference for the **icon-pack convention**.

- **Convention:** a pack ships a didi module (`awsIconsModule`) whose `icons` factory spreads the
  engine's base icons and then its own — composed after the core modules, it extends the node-icon
  set without replacing the defaults. Consumers do `new Editor({ modules: [awsIconsModule] })`.
- **Build-time pipeline:** `scripts/generate-icons.mjs` bundles every SVG under `src/svg/` into a
  typed `src/icons.generated.ts` map (`pnpm --filter @d3-polytree/icons-amazon generate`, also run
  by `build`).
- **Scope:** a **representative subset** (8 icons) is bundled in `src/svg/`. The full 300-icon AWS
  **catalogue is preserved in `catalog/`** (raw SVG assets, not bundled); promoting the full set is
  `cp catalog/*.svg src/svg/ && pnpm generate` — no code change.

Retires the beta `lib/**` (Icons feature + Viewer/InteractiveViewer/Editor wrappers), `webpack.config.js`
and the legacy manifest. The old wrappers are superseded by the compose-the-module convention above.
