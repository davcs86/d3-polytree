# @d3-polytree/pfdn-moddle — modernization status

**Parked (imported in Track B / B1).** Source and full git history were imported
via `git subtree` (history/authorship preserved; see `git blame`). The package is
intentionally inert for now:

- `package.json` is a minimal stub (no dependencies, no scripts) so it does not pull
  the 2017 toolchain into the workspace install or run in CI.
- The original manifest is kept as [`package.json.legacy`](./package.json.legacy)
  for reference.
- The directory is excluded from the modern ESLint config until migrated.

**Next (B4):** convert to TypeScript/ESM, replace `moddle`/`moddle-xml`/mocha wiring
with current versions + Vitest, add `build`/`test`/`typecheck` scripts, and drop `private`
to publish as `@d3-polytree/pfdn-moddle`.
