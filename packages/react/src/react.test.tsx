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
});
