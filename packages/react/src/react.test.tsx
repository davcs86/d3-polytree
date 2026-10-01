import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PolytreeEditor, type PolytreeEditorHandle } from './index';

interface Bus {
  emit(event: string, ...args: unknown[]): void;
}

// React's act() requires this flag in a test environment.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('<PolytreeEditor /> (React wrapper)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it('mounts an editor and exposes it via ref', () => {
    const ref = createRef<PolytreeEditorHandle>();
    act(() => {
      root.render(<PolytreeEditor ref={ref} />);
    });
    expect(container.querySelector('svg')).not.toBeNull();
    expect(ref.current?.getEditor()).not.toBeNull();
    expect(ref.current?.export()).toContain('pfdn:diagram');
  });

  it('fires onChange on a committed edit (document.changed)', () => {
    const onChange = vi.fn();
    const ref = createRef<PolytreeEditorHandle>();
    act(() => {
      root.render(<PolytreeEditor ref={ref} onChange={onChange} />);
    });
    act(() => {
      ref.current!.getEditor()!.get<Bus>('eventBus').emit('document.changed', { dirty: true });
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].dirty).toBe(true);
    expect(onChange.mock.calls[0][0].getValue()).toContain('pfdn:diagram');
  });

  it('tears the editor down on unmount', () => {
    const ref = createRef<PolytreeEditorHandle>();
    act(() => {
      root.render(<PolytreeEditor ref={ref} />);
    });
    act(() => root.unmount());
    expect(ref.current?.getEditor() ?? null).toBeNull();
    // re-create a root so afterEach's unmount is a no-op-safe call
    root = createRoot(container);
  });

  it('composes `modules` and reboots (preserving the document) when the array changes', async () => {
    const probe = (tag: string) => ({ probe: ['value', { tag }] }) as never;
    const ref = createRef<PolytreeEditorHandle>();
    const a = [probe('A')];
    act(() => {
      root.render(<PolytreeEditor ref={ref} modules={a} />);
    });
    const editor = ref.current!.getEditor()!;
    expect(editor.get<{ tag: string }>('probe').tag).toBe('A');
    const before = ref.current!.export();

    // same identity → no reboot
    const importSpy = vi.spyOn(editor, 'importDiagram');
    act(() => {
      root.render(<PolytreeEditor ref={ref} modules={a} />);
    });
    expect(importSpy).not.toHaveBeenCalled();

    // new array → in-place reboot with the new modules, same document
    await act(async () => {
      root.render(<PolytreeEditor ref={ref} modules={[probe('B')]} />);
    });
    await vi.waitFor(() => expect(editor.get<{ tag: string }>('probe').tag).toBe('B'));
    expect(ref.current!.getEditor()).toBe(editor);
    expect(ref.current!.export()).toBe(before);
  });

  it('reports a defaultValue that fails to import via onError', async () => {
    const onError = vi.fn();
    const ref = createRef<PolytreeEditorHandle>();
    await act(async () => {
      root.render(<PolytreeEditor ref={ref} defaultValue="<not-pfdn" onError={onError} />);
    });
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    // nothing loaded: export() reports the last input instead of throwing
    expect(ref.current!.export()).toBe('<not-pfdn');
  });

  it('logs the import failure when no onError is given', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      root.render(<PolytreeEditor defaultValue="<not-pfdn" />);
    });
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
  });

  it('StrictMode double-mount boots exactly one engine for a pending defaultValue', async () => {
    const { StrictMode } = await import('react');
    const seed = createRef<PolytreeEditorHandle>();
    act(() => {
      root.render(<PolytreeEditor ref={seed} />);
    });
    const xml = seed.current!.export();
    act(() => root.unmount());
    root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <PolytreeEditor defaultValue={xml} />
        </StrictMode>
      );
    });
    await vi.waitFor(() =>
      expect(container.querySelectorAll('svg[pointer-events="all"]')).toHaveLength(1)
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelectorAll('svg[pointer-events="all"]')).toHaveLength(1);
  });
});
