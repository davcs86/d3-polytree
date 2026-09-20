import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { D3PolytreeEditorElement } from './index';

// Importing the module self-registers <d3-polytree-editor>.

interface Bus {
  emit(event: string, ...args: unknown[]): void;
}
interface WithEditor {
  _editor: { get<T>(t: string): T; exportDiagram(): string } | null;
}

function fireDocumentChanged(el: D3PolytreeEditorElement): void {
  const editor = (el as unknown as WithEditor)._editor!;
  editor.get<Bus>('eventBus').emit('document.changed', { dirty: true });
}

describe('<d3-polytree-editor>', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the tag and upgrades to the element class', () => {
    expect(customElements.get('d3-polytree-editor')).toBe(D3PolytreeEditorElement);
    const el = document.createElement('d3-polytree-editor');
    expect(el).toBeInstanceOf(D3PolytreeEditorElement);
  });

  it('boots an editor into its shadow root and injects styles', () => {
    const el = document.createElement('d3-polytree-editor') as D3PolytreeEditorElement;
    document.body.appendChild(el);

    const root = el.shadowRoot!;
    expect(root).not.toBeNull();
    // the engine rendered its SVG surface inside the shadow root
    expect(root.querySelector('svg')).not.toBeNull();
    // CSS was inlined (constructable stylesheet or a <style> fallback)
    const hasAdopted = (root.adoptedStyleSheets?.length ?? 0) > 0;
    const hasStyleTag = root.querySelector('style') !== null;
    expect(hasAdopted || hasStyleTag).toBe(true);
  });

  it('reflects value ⇄ attribute', () => {
    const el = document.createElement('d3-polytree-editor') as D3PolytreeEditorElement;
    document.body.appendChild(el);
    // an empty diagram exports a non-empty .pfdn string
    expect(el.value).toContain('pfdn:diagram');
  });

  it('calls setFormValue and dispatches `change` on a committed edit', () => {
    const setFormValue = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'attachInternals').mockReturnValue({
      setFormValue
    } as unknown as ElementInternals);

    const el = document.createElement('d3-polytree-editor') as D3PolytreeEditorElement;
    const onChange = vi.fn();
    el.addEventListener('change', onChange);
    document.body.appendChild(el);

    // setFormValue is also called once on boot (initial form value); clear so we
    // assert the edit specifically.
    expect(setFormValue).toHaveBeenCalled();
    setFormValue.mockClear();

    fireDocumentChanged(el);

    expect(setFormValue).toHaveBeenCalledTimes(1);
    expect(setFormValue.mock.calls[0][0]).toContain('pfdn:diagram');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not throw when ElementInternals lacks setFormValue (graceful degrade)', () => {
    // Default jsdom internals stub has no setFormValue; the guard must skip it.
    const el = document.createElement('d3-polytree-editor') as D3PolytreeEditorElement;
    const onChange = vi.fn();
    el.addEventListener('change', onChange);
    document.body.appendChild(el);

    expect(() => fireDocumentChanged(el)).not.toThrow();
    expect(onChange).toHaveBeenCalledTimes(1); // value still delivered via the event
  });

  it('exportSVG() inlines the shadow CSS into the returned markup', () => {
    const el = document.createElement('d3-polytree-editor') as D3PolytreeEditorElement;
    document.body.appendChild(el);
    const svg = el.exportSVG();
    expect(svg).toContain('<svg');
    expect(svg).toContain('<style>');
  });

  it('exportSVG() pins the export to the light theme (C13 export neutrality)', () => {
    // Fresh elements per export — the engine's exportSVG appends a <style> to the
    // live SVG on each call (not idempotent across calls on one instance), so
    // theme-invariance is asserted across two instances, one with a dark host.
    const light = document.createElement('d3-polytree-editor') as D3PolytreeEditorElement;
    document.body.appendChild(light);
    const dark = document.createElement('d3-polytree-editor') as D3PolytreeEditorElement;
    dark.setAttribute('data-pfd-theme', 'dark');
    document.body.appendChild(dark);

    const lightSvg = light.exportSVG();
    const darkSvg = dark.exportSVG();

    // The export is stamped light and is byte-identical regardless of the host's
    // active theme — a dark viewer never leaks into an exported SVG.
    expect(lightSvg).toContain('data-pfd-theme="light"');
    expect(darkSvg).toBe(lightSvg);
    // Tokens are self-contained in the injected CSS (no host-page :root
    // dependency); selection is present (theme-invariant).
    expect(lightSvg).toContain('--pfd-color-selection');
    expect(lightSvg).toContain(':host');
  });

  it('tears down on disconnect without throwing', () => {
    const el = document.createElement('d3-polytree-editor') as D3PolytreeEditorElement;
    document.body.appendChild(el);
    expect(() => el.remove()).not.toThrow();
    expect((el as unknown as WithEditor)._editor).toBeNull();
  });
});
