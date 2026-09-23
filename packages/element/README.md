# @d3-polytree/element

The **`<d3-polytree-editor>`** custom element — a framework-free, shadow-DOM wrapper around the
[`@d3-polytree/editor`](https://github.com/davcs86/d3-polytree/tree/main/packages/editor). It hosts
the editor with no engine fork, reflects the serialized `.pfdn` document as a `value` property /
attribute, participates in `<form>`s via `ElementInternals` (feature-gated), and emits a `change`
`CustomEvent` on every committed edit. All styling is inlined into the shadow root, so it renders
identically wherever you drop it.

**[▶ Live demo](https://davcs86.github.io/d3-polytree/)** in Storybook.

## Install

```sh
pnpm add @d3-polytree/element
```

Ships ESM + CJS + `.d.ts` and a self-contained **UMD** bundle (`dist/element.umd.js`). Importing the
package **registers the tag as a side effect** — no D3 peer deps to add and no CSS import (styles are
inlined into the shadow root).

## Usage

### As a plain HTML element

```html
<script type="module">
  import '@d3-polytree/element'; // registers <d3-polytree-editor>
</script>

<d3-polytree-editor style="display:block; width:100%; height:600px;"></d3-polytree-editor>
```

Seed it with a document via the `value` attribute, and read edits back off the `change` event:

```html
<d3-polytree-editor id="ed" value="<pfdn:diagram …>…</pfdn:diagram>"></d3-polytree-editor>
<script type="module">
  import '@d3-polytree/element';
  const el = document.getElementById('ed');
  el.addEventListener('change', (e) => console.log('new .pfdn:', e.detail));
</script>
```

### Inside a `<form>`

The element is **form-associated** (`static formAssociated = true`) via `ElementInternals`, so its
current `.pfdn` document is submitted with the form under the element's `name` — no hidden input, no
glue code:

```html
<form>
  <d3-polytree-editor name="diagram"></d3-polytree-editor>
  <button type="submit">Save</button>
</form>
```

Where `ElementInternals` is unavailable (older engines, jsdom), form association degrades gracefully
and the rest of the element keeps working.

### Explicit registration

Auto-registration happens on import. To register under your own control (e.g. after feature-checks),
call the named export:

```ts
import { defineD3PolytreeEditor } from '@d3-polytree/element';
defineD3PolytreeEditor(); // idempotent — guards HMR / repeated evaluation
```

## API

| Member                     | Type                  | Description                                                                                                                                       |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                    | property / attribute  | The current diagram as a `.pfdn` XML string; setting it reloads the editor (echo-guarded so the element never reloads on its own emitted change). |
| `exportSVG()`              | method                | The current SVG with the shadow-scoped CSS inlined, pinned to the light theme so exports stay theme-invariant.                                    |
| `change`                   | `CustomEvent<string>` | Fired on every committed edit; `detail` is the new `.pfdn`. Bubbles and crosses the shadow boundary (`composed`).                                 |
| `D3PolytreeEditorElement`  | class                 | The element class, if you need to subclass or reference it.                                                                                       |
| `defineD3PolytreeEditor()` | function              | Idempotent tag registration.                                                                                                                      |

The element gives itself `tabindex="0"` (so keyboard undo/redo reaches the editor) and delegates focus
into the shadow root. The editor subscription survives `importDiagram` reboots, so external `value`
changes never drop the `change` wiring.

## When to use it

Reach for this adapter when you want the editor in **any** framework (or none) through a standard DOM
element and form semantics. For an idiomatic React binding with imperative `ref` handles, use
[`@d3-polytree/react`](https://github.com/davcs86/d3-polytree/tree/main/packages/react) instead.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
