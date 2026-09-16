# CLAUDE.md — @d3-polytree/storybook

Package-specific notes; see the repo-root `CLAUDE.md` for the big picture.

The dev harness / visual-regression baseline / docs site — private, never published, and **ignored by
Changesets**.

- `@storybook/html-vite` (the components are framework-free DOM/SVG). Stories are `src/**/*.stories.@(ts|js)`.
- Shared `.pfdn` fixtures live in `src/sample.ts`; the **`Guides/Kitchensink`** story is the worked
  example of the extension seams (custom feature module, custom node-type drawer, programmatic API).
- Stories import the components' **compiled** CSS (`@d3-polytree/interactive-viewer/style.css`,
  `@d3-polytree/editor/style.css`), so the packages must be built first.
- This app has its own `typecheck` script (it is in the `turbo run typecheck` graph); keep story types
  clean or CI fails.
