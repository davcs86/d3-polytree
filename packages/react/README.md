# @d3-polytree/react

A thin, idiomatic **React** wrapper around the
[`@d3-polytree/editor`](https://github.com/davcs86/d3-polytree/tree/main/packages/editor). It bridges
the engine's event bus into React with `useSyncExternalStore` (tear-free under React 18/19 concurrent
rendering) and exposes the editor through props + an imperative `ref`.

**[▶ Live demo](https://davcs86.github.io/d3-polytree/)** in Storybook.

## Install

```sh
pnpm add @d3-polytree/react react react-dom
```

`react` and `react-dom` (`>=18`) are **peer dependencies**. Ships ESM + CJS + `.d.ts`.

## Uncontrolled by design

`Editor.importDiagram` is a destructive async reboot — it rebuilds the engine, clearing the undo stack
and selection — so a fully controlled `value` prop would echo-loop and destroy history on every edit.
The component is therefore **uncontrolled**:

- `defaultValue` seeds the document **once**, on mount.
- `onChange` / `onSelectionChange` report edits.
- An imperative `ref` (`load` / `export` / `getEditor`) covers external reloads.

## Usage

```tsx
import { useRef } from 'react';
import { PolytreeEditor, type PolytreeEditorHandle } from '@d3-polytree/react';
import '@d3-polytree/interactive-viewer/style.css'; // side-tabs + search panels
import '@d3-polytree/editor/style.css'; // properties panel

function App() {
  const ref = useRef<PolytreeEditorHandle>(null);

  return (
    <>
      <PolytreeEditor
        ref={ref}
        defaultValue={initialPfdnXml}
        onChange={({ dirty, getValue }) => {
          if (dirty) console.log(getValue()); // getValue() serializes lazily
        }}
        onSelectionChange={(prev, next) => console.log(next)}
        style={{ width: '100%', height: 600 }}
      />
      <button onClick={() => ref.current?.load(otherPfdnXml)}>Load</button>
      <button onClick={() => console.log(ref.current?.export())}>Export</button>
    </>
  );
}
```

> The stylesheets are inherited from `@d3-polytree/editor`; import both so the side-tabs, search, and
> properties panels are styled.

## API

### Props — `PolytreeEditorProps`

| Prop                | Type                               | Description                                                       |
| ------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| `defaultValue`      | `string`                           | The `.pfdn` document to open on mount (applied once).             |
| `onChange`          | `(change: PolytreeChange) => void` | Fired on every committed edit.                                    |
| `onSelectionChange` | `(prev, next) => void`             | Fired on selection changes, in the engine's `(prev, next)` order. |
| `className`         | `string`                           | Class on the host `<div>`.                                        |
| `style`             | `CSSProperties`                    | Inline style on the host `<div>`.                                 |

`PolytreeChange` = `{ dirty: boolean; getValue: () => string }` — `getValue` serializes lazily so a
handler that only checks `dirty` never pays the serialization cost.

### Ref handle — `PolytreeEditorHandle`

| Method                        | Description                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| `getEditor()`                 | The underlying `Editor` instance (or `null` before mount / after unmount). |
| `load(xml)` → `Promise<void>` | Load a `.pfdn` document (a reboot — clears undo/selection).                |
| `export()` → `string`         | Serialize the current document to a `.pfdn` string.                        |

`PolytreeEditor` is also the default export. The event-bus bridge subscribes through the editor's
stable `on`/`off` surface, so the subscription survives `load()` reboots.

## Links

- [Repository](https://github.com/davcs86/d3-polytree)
- [Live Storybook](https://davcs86.github.io/d3-polytree/)

## License

MIT © David Castillo
