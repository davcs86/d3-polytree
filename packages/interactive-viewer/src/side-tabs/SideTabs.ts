import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap } from '@d3-polytree/canvas';
import type { Canvas } from '@d3-polytree/canvas';
import type { SideTabEntry, SideTabsProvider } from './SideTabsProvider';

/** Parse a small HTML fragment into its first element. */
function fromHtml(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
}

/**
 * A collapsible tabbed side panel. Renders a tab strip and a matching content
 * area from the {@link SideTabsProvider}; clicking a tab opens its content,
 * the close button collapses the panel. Ported from `@d3-polytree/side-tabs`'
 * `lib/SideTabs.js`, modernised off `min-dom` / `lodash` onto native DOM.
 */
export class SideTabs {
  static readonly $inject = ['canvas', 'sideTabsProvider', 'eventBus'];

  private readonly _canvas: Canvas;
  private readonly _sideTabsProvider: SideTabsProvider;
  private readonly _eventBus: EventEmitter<DiagramEventMap>;

  private _container!: HTMLElement;
  private _tabsEl!: HTMLElement;
  private _contentsEl!: HTMLElement;
  private _actions: SideTabEntry[] = [];

  constructor(canvas: Canvas, sideTabsProvider: SideTabsProvider, eventBus: EventEmitter<DiagramEventMap>) {
    this._canvas = canvas;
    this._sideTabsProvider = sideTabsProvider;
    this._eventBus = eventBus;
    this._init();
  }

  trigger(action: string, button: Element | null, targetId?: string): void {
    const id = button ? (button.getAttribute('data-action') ?? undefined) : targetId;
    if (id === undefined) {
      return;
    }
    const entry = this._actions[Number(id)];
    if (!entry) {
      return;
    }

    if (action === 'click') {
      // Toggle semantics: clicking the already-active tab collapses the panel
      // (the panel was otherwise stuck open — it only ever added `.open`).
      const tab = this._tabsEl.querySelector(`.pfdjs-st-tab[data-action="${id}"]`);
      const isActive = this._container.classList.contains('open') && !!tab?.classList.contains('active');
      if (isActive) {
        this._readjustTabs();
        return;
      }
      this._readjustTabs(id);
    } else if (action === 'close') {
      this._readjustTabs();
    }

    const content = this._contentsEl.querySelector<HTMLElement>(
      `.pfdjs-st-content[data-action="${id}"] > .content-body`
    );
    const handler = entry.action;
    if (typeof handler === 'function') {
      if (action === 'click') {
        handler(content);
      }
    } else {
      handler[action]?.(content);
    }
  }

  private _readjustTabs(id?: string): void {
    if (id === undefined) {
      this._container.classList.remove('open');
    } else {
      this._container.classList.add('open');
    }
    this._actions.forEach((_action, n) => {
      const tab = this._tabsEl.querySelector(`[data-action="${n}"]`);
      const content = this._contentsEl.querySelector(`.pfdjs-st-content[data-action="${n}"]`);
      const active = String(n) === id;
      tab?.classList.toggle('active', active);
      content?.classList.toggle('hidden', !active);
    });
  }

  private _drawContainer(): void {
    this._container = fromHtml(SideTabs.HTML_MARKUP);
    const container = this._canvas.getContainer();
    container.insertBefore(this._container, container.firstChild);
    this._tabsEl = this._container.querySelector('.pfdjs-st-tabs') as HTMLElement;
    this._contentsEl = this._container.querySelector('.pfdjs-st-contents') as HTMLElement;
  }

  private _drawEntry(entry: SideTabEntry, id: number): void {
    const tab = fromHtml('<div class="pfdjs-st-tab"></div>');
    this._tabsEl.appendChild(tab);
    tab.setAttribute('data-action', String(id));
    if (entry.title) {
      tab.setAttribute('title', entry.title);
    }
    if (entry.iconClassName) {
      const icon = document.createElement('span');
      icon.className = entry.iconClassName;
      tab.appendChild(icon);
    }

    const content = fromHtml(
      '<div class="pfdjs-st-content hidden">' +
        '<div class="content-title">' +
        `<span class="content-title-span">${entry.title ?? ''}</span>` +
        '<span class="icon-cancel" title="Close"></span>' +
        '<span>&nbsp;</span>' +
        '</div>' +
        '<div class="content-body"></div>' +
        '</div>'
    );
    this._contentsEl.appendChild(content);
    content.setAttribute('data-action', String(id));
    content.querySelector('.icon-cancel')?.setAttribute('data-action', String(id));

    this.trigger('created', null, String(id));
  }

  private _drawEntries(): void {
    this._actions = this._sideTabsProvider.getSideTabsEntries();
    this._actions.forEach((action, n) => this._drawEntry(action, n));
  }

  private _update(): void {
    if (this._tabsEl) {
      this._tabsEl.replaceChildren();
      this._contentsEl.replaceChildren();
    }
    this._drawEntries();
  }

  private _createDelegates(): void {
    this._tabsEl.addEventListener('click', (event) => {
      const tab = (event.target as Element).closest('.pfdjs-st-tab');
      if (tab) {
        this.trigger('click', tab);
        event.stopImmediatePropagation();
      }
    });
    this._contentsEl.addEventListener('click', (event) => {
      const cancel = (event.target as Element).closest('.icon-cancel');
      if (cancel) {
        this.trigger('close', cancel);
        event.stopImmediatePropagation();
      }
    });
  }

  private _init(): void {
    this._drawContainer();
    this._update();
    this._eventBus.on('sidetab.registered', () => this._update());
    this._createDelegates();
  }

  static readonly HTML_MARKUP =
    '<div class="pfdjs-st-container">' +
    '<div class="pfdjs-st-tabs"></div>' +
    '<div class="pfdjs-st-contents"></div>' +
    '</div>';
}
