'use client';

/**
 * `@d3-polytree/react` — a thin React wrapper around the polytree {@link Editor}.
 *
 * **Uncontrolled by design.** `Editor.importDiagram` is a destructive async reboot
 * (it rebuilds the engine, clearing the undo stack and selection), so a
 * controlled `value` prop would echo-loop and destroy history on every edit.
 * Instead: `defaultValue` seeds the document once, `onChange`/`onSelectionChange`
 * report edits, and an imperative `ref` (`load`/`export`/`getEditor`) covers
 * external reloads. The engine event bus is bridged via `useSyncExternalStore`
 * with a monotonic version-counter snapshot, so React 18/19 concurrent rendering
 * cannot tear; the subscription is taken through the component's stable `on/off`
 * surface, so it survives `load()` reboots.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
  type CSSProperties
} from 'react';
import { Editor, type EditorOptions } from '@d3-polytree/editor';

/** Extra didi modules (icon packs, custom features) — the `Editor` `modules` option. */
export type EditorModules = NonNullable<EditorOptions['modules']>;

export interface PolytreeChange {
  /** Whether the document has an undoable change past the baseline. */
  dirty: boolean;
  /** Lazily serialize the current document to a `.pfdn` string. */
  getValue: () => string;
}

export interface PolytreeEditorHandle {
  /** The underlying editor instance (or null before mount / after unmount). */
  getEditor(): Editor | null;
  /** Load a `.pfdn` document (a reboot — clears undo/selection). */
  load(xml: string): Promise<void>;
  /** Serialize the current document to a `.pfdn` string. */
  export(): string;
}

export interface PolytreeEditorProps {
  /** The `.pfdn` document to open on mount. Applied once (uncontrolled). */
  defaultValue?: string;
  /** Fired on every committed edit (via the engine's `document.changed`). */
  onChange?: (change: PolytreeChange) => void;
  /**
   * Extra didi modules composed after the editor's own (last definition wins),
   * e.g. `[awsIconsModule]`. Modules are boot-time in didi, so a *different*
   * array after mount reboots the engine and re-imports the current document
   * (undo history and selection reset). Compared by identity — keep it stable
   * (module scope or `useMemo`) to avoid needless reboots.
   */
  modules?: EditorModules;
  /** Fired on selection changes, in the engine's `(prev, next)` order. */
  onSelectionChange?: (prev: readonly unknown[], next: readonly unknown[]) => void;
  className?: string;
  style?: CSSProperties;
}

interface Store {
  counter: number;
  listeners: Set<() => void>;
}

export const PolytreeEditor = forwardRef<PolytreeEditorHandle, PolytreeEditorProps>(
  function PolytreeEditor(props, ref) {
    const { defaultValue, modules, onChange, onSelectionChange, className, style } = props;

    const hostRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<Editor | null>(null);
    /** The options the editor booted with; `modules` is re-read on every reboot. */
    const optionsRef = useRef<EditorOptions | null>(null);
    // Always call the latest props without re-subscribing the bus.
    const cbRef = useRef({ onChange, onSelectionChange });
    cbRef.current = { onChange, onSelectionChange };

    const storeRef = useRef<Store | null>(null);
    if (storeRef.current === null) {
      storeRef.current = { counter: 0, listeners: new Set() };
    }
    const store = storeRef.current;

    const subscribe = useCallback(
      (cb: () => void) => {
        store.listeners.add(cb);
        return () => {
          store.listeners.delete(cb);
        };
      },
      [store]
    );
    const getSnapshot = useCallback(() => store.counter, [store]);
    const getServerSnapshot = useCallback(() => 0, []);
    // Tear-free bridge; the return value (the counter) is intentionally unused —
    // subscribing is what keeps React in sync with the engine.
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editorRef.current,
        load: (xml: string) => editorRef.current?.importDiagram(xml) ?? Promise.resolve(),
        export: () => editorRef.current?.exportDiagram() ?? ''
      }),
      []
    );

    useEffect(() => {
      const host = hostRef.current;
      if (!host) {
        return;
      }
      const options: EditorOptions = { container: host, modules };
      optionsRef.current = options;
      const editor = new Editor(options);
      editorRef.current = editor;

      const bump = (): void => {
        store.counter += 1;
        store.listeners.forEach((l) => l());
      };
      const onDoc = (payload: { dirty: boolean }): void => {
        bump();
        cbRef.current.onChange?.({
          dirty: payload.dirty,
          getValue: () => editor.exportDiagram()
        });
      };
      const onSel = (prev: readonly unknown[], next: readonly unknown[]): void => {
        bump();
        cbRef.current.onSelectionChange?.(prev, next);
      };
      // Stable subscriptions — survive the reboot inside load()/importDiagram.
      editor.on('document.changed', onDoc);
      editor.on('selection.changed', onSel);

      if (defaultValue != null && defaultValue !== '') {
        void editor.importDiagram(defaultValue);
      } else {
        editor.createEmpty();
      }

      return () => {
        editor.off('document.changed', onDoc);
        editor.off('selection.changed', onSel);
        editor.destroy();
        editorRef.current = null;
        optionsRef.current = null;
      };
      // Mount once; `defaultValue` is uncontrolled (later changes use ref.load()),
      // and `modules` changes are applied by the reboot effect below.
    }, []);

    // A new `modules` array reboots the engine in place (the boot reads
    // `options.modules`); the `on()` subscriptions above survive the reboot.
    useEffect(() => {
      const editor = editorRef.current;
      const options = optionsRef.current;
      if (!editor || !options || options.modules === modules) {
        return; // first mount (already booted with these) or unchanged identity
      }
      options.modules = modules;
      if (editor.getHost()) {
        void editor.importDiagram(editor.exportDiagram());
      }
    }, [modules]);

    return <div ref={hostRef} className={className} style={style} />;
  }
);

export default PolytreeEditor;
