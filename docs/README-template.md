# Package README template & authoring guide

Every publishable `@d3-polytree/*` package ships a README that follows the **same structure**, so each
npm package page is self-contained and the ecosystem reads as one system. This document is the source
of truth for that structure. It has two parts:

1. **[Authoring rules](#authoring-rules)** — what a good package README must do (and must not do).
2. **[The skeleton](#the-skeleton)** — a copy-paste starting point with placeholders.

> **For future AI assistants / contributors:** when you add a package, or touch a package's public
> API, update its README to match this template. Keep the section order below; omit a section only
> when it genuinely does not apply (see the per-section notes). Do **not** invent API — every symbol,
> method, option, and peer dependency you document must exist in that package's source.

---

## Authoring rules

**Structure (in this order).** `# title` → one-/two-line intro → optional live-demo line → `## Install`
→ a **feature or API table** → `## Usage` → `## API` (when the package has a public API worth a table)
→ optional **where-it-fits / adapters / styling** section → `## Links` → `## License`.

**Voice & scope.**
- Lead with **what the package is and what it's for**, in one or two sentences, and cross-link the
  packages it sits next to in the dependency graph (`canvas → core → viewer → interactive-viewer →
  editor`; `pfdn-moddle`, `layout`, `ssr`, `icons-amazon`, `element`, `react` hang off that spine).
- Cross-links in a **published** README must be **absolute GitHub URLs** on the **`main`** branch
  (`https://github.com/davcs86/d3-polytree/tree/main/packages/<name>`), never relative `../x` paths —
  npm renders the README off-repo, so relative links break. (There is no `v2` branch; never link one.)
- Write **tool-neutral, accurate** prose. Prefer a small table over paragraphs for exports/methods.

**Install.**
- Show the real install line. If the package has **peer dependencies**, list them in the `pnpm add`
  command and say one sentence about why they're peers. The D3 v7 slices
  (`d3-selection d3-zoom d3-transition d3-scale d3-axis d3-drag`) are peers of `core` and every
  component; `react`/`react-dom` are peers of `@d3-polytree/react`. Packages that render in Node
  (`ssr`) or inline their styles (`element`) have **no** peer deps — say so.

**Usage.**
- At least one runnable example against the **actual public API**. For the three UMD components
  (`viewer`, `interactive-viewer`, `editor`) also show the `<script>` + global form
  (`d3PolytreeViewer` / `d3PolytreeInteractiveViewer` / `d3PolytreeEditor`).
- If the package ships CSS (`interactive-viewer`, `editor`), show the `import '.../style.css'` lines.

**Accuracy > completeness.** Verify claims against source before writing them:
- Public exports: read `src/index.ts(x)`.
- Peer deps and the `./style.css` / `./umd` exports: read `package.json`.
- Don't document private/internal modules as if they were public API.

**Footer.**
- `## Links` → repository + live Storybook (and any adapters/related packages worth surfacing).
- `## License` → `MIT © David Castillo` (icon/asset packs add their upstream attribution line).

**When you change a README, add a Changeset.** npm only re-renders a README on **republish**, so a
docs-only edit needs a `patch` changeset for the affected package(s) or the update never reaches npm
(`pnpm changeset`). See the "Releases" section of the root `CLAUDE.md`.

---

## The skeleton

Copy this, replace every `{{PLACEHOLDER}}`, delete the `<!-- notes -->`, and drop any section that
truly doesn't apply.

````markdown
# @d3-polytree/{{name}}

{{One or two sentences: what this package is and what it's for.}} Part of the
[d3-polytree](https://github.com/davcs86/d3-polytree) ecosystem — {{how it relates to its neighbours,
with absolute /tree/main/ cross-links}}.

<!-- Live-demo line: use the package's specific Storybook story if it has one; otherwise link the
     Storybook root, or omit for a pure-logic package (layout, pfdn-moddle, ssr). -->
**[▶ Live demo]({{storybook-url}})** in Storybook.

## Install

```sh
pnpm add @d3-polytree/{{name}}{{ peer-deps if any }}
```

<!-- One sentence on peer deps if the package has any; otherwise state it has none and why. -->
{{Peer-dependency note.}}

## {{What's inside | Features}}

<!-- A table is preferred. Columns depend on the package: Export | Kind | Role for a toolbox;
     Type | Role for a model; a bulleted feature list for a component. -->
| Export | Kind | Role |
| --- | --- | --- |
| `{{Symbol}}` | {{class/function/module/type}} | {{one-line role}} |

## Usage

```ts
import { {{Symbol}} } from '@d3-polytree/{{name}}';

{{minimal, runnable example against the real public API}}
```

<!-- Components only: also show the <script>/UMD form and any style.css imports. -->

## API

<!-- Include when there's a public surface worth tabulating (constructor options, methods, props). -->
| {{Method / Option / Prop}} | Type | Description |
| --- | --- | --- |
| `{{name}}` | `{{type}}` | {{what it does}} |

## {{Where it fits | Adapters | Styling & theming}}

<!-- Optional: dependency-graph placement, related adapters, CSS/theming notes. -->

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
````

---

## Reference implementations

These live READMEs already follow the template and are good models to copy from:

- **Toolbox / library** → [`packages/canvas`](../packages/canvas/README.md),
  [`packages/layout`](../packages/layout/README.md)
- **Model** → [`packages/pfdn-moddle`](../packages/pfdn-moddle/README.md)
- **Engine** → [`packages/core`](../packages/core/README.md)
- **Component (with UMD + CSS)** → [`packages/editor`](../packages/editor/README.md),
  [`packages/interactive-viewer`](../packages/interactive-viewer/README.md)
- **Adapter** → [`packages/element`](../packages/element/README.md),
  [`packages/react`](../packages/react/README.md)
- **Node-only tool** → [`packages/ssr`](../packages/ssr/README.md)
- **Icon pack** → [`packages/icons-amazon`](../packages/icons-amazon/README.md)
