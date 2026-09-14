import type { Canvas } from '@d3-polytree/canvas';
import type { PaletteEntry, PaletteProvider } from './PaletteProvider';

/** Parse a small HTML fragment into its first element. */
function fromHtml(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
}

/**
 * The palette toolbar. Builds grouped entry buttons from the
 * {@link PaletteProvider} and delegates their clicks to the entry actions.
 *
 * Ported from `core-v2beta`'s `features/palette/Palette.js`, modernised off
 * `min-dom` onto native DOM + event delegation (`closest`).
 */
export class Palette {
  static readonly $inject = ['canvas', 'paletteProvider'];

  private readonly _canvas: Canvas;
  private readonly _paletteProvider: PaletteProvider;
  private _paletteContainer!: HTMLElement;
  private _entriesContainer!: HTMLElement;
  private _actions: Record<string, PaletteEntry> = {};

  constructor(canvas: Canvas, paletteProvider: PaletteProvider) {
    this._canvas = canvas;
    this._paletteProvider = paletteProvider;
    this._init();
  }

  trigger(action: string, event: Event, target?: Element | null): void {
    this._deactivateTools();
    const button = target ?? (event.target as Element).closest('.pfdjs-entry');
    if (!button) {
      return;
    }
    const entry = this._actions[button.getAttribute('data-action') ?? ''];
    if (!entry) {
      return;
    }
    const handler = entry.action;
    if (typeof handler === 'function') {
      if (action === 'click') {
        handler(event);
      }
    } else {
      handler[action]?.(event);
    }
  }

  getContainer(): HTMLElement {
    return this._paletteContainer;
  }

  private _deactivateTools(): void {
    const tools = this._paletteProvider.getPaletteTools();
    Object.values(tools).forEach((tool) => tool.deactivate());
  }

  private _drawContainer(): void {
    this._paletteContainer = fromHtml(Palette.HTML_MARKUP);
    const container = this._canvas.getContainer();
    container.insertBefore(this._paletteContainer, container.firstChild);
    this._entriesContainer = this._paletteContainer.querySelector('.pfdjs-entries') as HTMLElement;
  }

  private _drawEntry(entry: PaletteEntry, id: string): void {
    const grouping = entry.group ?? 'default';
    let group = this._entriesContainer.querySelector<HTMLElement>(`[data-group="${grouping}"]`);
    if (!group) {
      group = fromHtml(`<div class="pfdjs-entries-group" data-group="${grouping}"></div>`);
      this._entriesContainer.appendChild(group);
    }

    const control = fromHtml(entry.html ?? '<div class="pfdjs-entry"></div>');
    group.appendChild(control);

    control.setAttribute('data-action', id);
    if (entry.title) {
      control.setAttribute('title', entry.title);
    }
    if (entry.className) {
      control.classList.add(entry.className);
    }
    if (entry.iconClassName) {
      const icon = document.createElement('span');
      icon.className = entry.iconClassName;
      control.appendChild(icon);
    }
  }

  private _drawEntries(): void {
    this._actions = this._paletteProvider.getPaletteEntries();
    Object.entries(this._actions).forEach(([id, action]) => this._drawEntry(action, id));
  }

  private _createDelegates(): void {
    this._paletteContainer.addEventListener('click', (event) => {
      const button = (event.target as Element).closest('.pfdjs-entry');
      if (button) {
        this.trigger('click', event, button);
        event.stopImmediatePropagation();
      }
    });
    // deactivate any active tool when interacting with the palette itself
    this._paletteContainer.addEventListener('mousedown', () => this._deactivateTools());
  }

  private _init(): void {
    this._drawContainer();
    this._drawEntries();
    this._createDelegates();
  }

  static readonly HTML_MARKUP =
    '<div class="pfdjs-palette"><div class="pfdjs-entries"></div></div>';
}
