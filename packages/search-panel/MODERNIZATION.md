# @d3-polytree/search-panel — modernization status

**Parked (imported in Track B / B1).** Source and full git history were imported via
`git subtree` (authorship/history preserved; see `git blame`). The package is
intentionally inert for now:

- `package.json` is a minimal stub (no dependencies, no scripts) so it does not pull the
  2017 toolchain into the workspace install or run in CI.
- The original manifest is kept as [`package.json.legacy`](./package.json.legacy).
- The directory is excluded from the modern ESLint config until migrated.

**Next:** convert to TS/ESM + Vitest, reassess list.js, add build/test/typecheck scripts, drop `private` (B3/B4).
