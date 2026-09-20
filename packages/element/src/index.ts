/**
 * `@d3-polytree/element` — the `<d3-polytree-editor>` custom element.
 *
 * A framework-free, shadow-DOM wrapper that hosts the existing
 * {@link Editor} (no engine fork). It reflects the serialized `.pfdn` document as
 * a `value` property/attribute, participates in `<form>`s via `ElementInternals`
 * (feature-gated — degrades gracefully where unsupported), and emits a `change`
 * `CustomEvent` on every committed edit. Styling is inlined into the shadow root
 * from the components' compiled CSS (see `styles.generated.ts`).
 */
import { Editor } from '@d3-polytree/editor';
import { shadowCss } from './styles.generated';

const TAG = 'd3-polytree-editor';

export class D3PolytreeEditorElement extends HTMLElement {
  /** Opt into form association (guarded: not all engines/hosts support it). */
  static readonly formAssociated = true;
  static readonly observedAttributes = ['value'];

  private _editor: Editor | null = null;
  private _internals: ElementInternals | null = null;
  /** The last `.pfdn` this element emitted — guards attribute echoes. */
  private _lastEmitted: string | null = null;
  private readonly _onDocChanged = (): void => {
    this._updateFormValue();
    this.dispatchEvent(
      new CustomEvent('change', { detail: this.value, bubbles: true, composed: true })
    );
  };

  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    // attachInternals is not universal (older browsers, jsdom's stub); guard it.
    try {
      this._internals = this.attachInternals?.() ?? null;
    } catch {
      this._internals = null;
    }
  }

  connectedCallback(): void {
    if (this._editor) {
      return; // already mounted
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0'); // so keyboard (undo/redo) reaches the editor
    }
    const root = this.shadowRoot!;
    this._injectStyles(root);

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    root.appendChild(container);

    const editor = new Editor({ container });
    this._editor = editor;
    // Subscribe once; the subscription survives importDiagram reboots (C7 surface).
    editor.on('document.changed', this._onDocChanged);

    const initial = this.getAttribute('value');
    if (initial != null && initial !== '') {
      void editor.importDiagram(initial).then(() => this._updateFormValue());
    } else {
      editor.createEmpty();
      this._updateFormValue(); // report the current document as the form value up front
    }
  }

  disconnectedCallback(): void {
    if (this._editor) {
      this._editor.off('document.changed', this._onDocChanged);
      this._editor.destroy();
      this._editor = null;
    }
    this._lastEmitted = null;
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name !== 'value' || !this._editor || value == null) {
      return;
    }
    // Only reload on a truly external change — never on our own emitted echo.
    if (value === this._lastEmitted) {
      return;
    }
    void this._editor.importDiagram(value).then(() => this._updateFormValue());
  }

  /** The current diagram as a `.pfdn` XML string (the form/submission value). */
  get value(): string {
    return this._editor ? this._editor.exportDiagram() : (this.getAttribute('value') ?? '');
  }

  set value(xml: string) {
    this.setAttribute('value', xml);
  }

  /**
   * The current SVG, with the shadow-scoped CSS inlined. The engine's own
   * `exportSVG` inlines CSS from `document.styleSheets`, which cannot see the
   * shadow root's styles — so we inject the compiled CSS into the returned markup.
   */
  exportSVG(): string {
    if (!this._editor) {
      return '';
    }
    const svg = this._editor.exportSVG();
    const styleTag = `<style>${shadowCss}</style>`;
    // Pin the export to the light theme: the injected shadowCss carries the dark
    // `@media`/`[data-pfd-theme]` token blocks, so without this an export viewed
    // under a dark OS (or inlined into a dark host page) would render dark chrome.
    // `svg[data-pfd-theme="light"]` (and `:root[...]` for a standalone document
    // root) re-declare the light tokens on the exported root, keeping exports
    // theme-invariant. Stamp the attribute onto the opening <svg> tag, then inject.
    const stamped = svg.replace(/<svg\b/, '<svg data-pfd-theme="light"');
    return stamped.replace(/(<svg\b[^>]*>)/, `$1${styleTag}`);
  }

  /**
   * Push the current document into the form value + reflect the `value`
   * attribute (echo-guarded). No `change` event — that is only for committed
   * edits (see `_onDocChanged`); this also runs on initial load so a `<form>`
   * has the document up front.
   */
  private _updateFormValue(): void {
    if (!this._editor) {
      return;
    }
    const xml = this._editor.exportDiagram();
    this._lastEmitted = xml;
    if (this.getAttribute('value') !== xml) {
      this.setAttribute('value', xml);
    }
    if (this._internals && typeof this._internals.setFormValue === 'function') {
      this._internals.setFormValue(xml);
    }
  }

  private _injectStyles(root: ShadowRoot): void {
    // Prefer constructable stylesheets; fall back to a <style> element (jsdom /
    // older engines lack adoptedStyleSheets).
    try {
      if ('adoptedStyleSheets' in root && typeof CSSStyleSheet !== 'undefined') {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(shadowCss);
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        return;
      }
    } catch {
      // fall through to <style>
    }
    const style = document.createElement('style');
    style.textContent = shadowCss;
    root.appendChild(style);
  }
}

/** Register the tag once (guards HMR / repeated module evaluation). */
export function defineD3PolytreeEditor(): void {
  if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
    customElements.define(TAG, D3PolytreeEditorElement);
  }
}

defineD3PolytreeEditor();
