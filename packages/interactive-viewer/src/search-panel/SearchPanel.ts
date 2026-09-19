import type EventEmitter from 'eventemitter3';
import type { DiagramEventMap, ElementClassName } from '@d3-polytree/canvas';
import type { UiIconName } from '@d3-polytree/core';

/** The side-tab registration surface this panel needs (structural — avoids a
 * hard build dependency on `@d3-polytree/side-tabs`; the token is supplied at
 * runtime when both are composed into the editor). */
export interface SideTabRegistration {
  title?: string;
  icon?: UiIconName;
  action: {
    created?: (content: HTMLElement | null) => void;
    click?: (content: HTMLElement | null) => void;
    [gesture: string]: ((content: HTMLElement | null) => void) | undefined;
  };
}
export interface SideTabsRegistrar {
  registerSideTab(tab: SideTabRegistration, index?: number): void;
}

/** A model element definition as read by the search panel. */
interface ElementDefinition {
  id?: string;
  type?: string;
  label?: { text?: string };
  $descriptor: { ns: { localName: string } };
}

/** A row in the search list. */
interface SearchItem {
  id: string;
  name: string;
  elementType: string;
  elementSubType: string;
  element: unknown;
  definition: ElementDefinition;
}

/**
 * A searchable index of the diagram's nodes and links, shown in a side tab.
 * Typing in the search box filters the list; clicking a row zooms to and
 * selects that element.
 *
 * Modernised (B6) from `@d3-polytree/search-panel`'s `lib/SearchPanel.js`: the
 * `list.js` dependency is replaced by a small native filter/sort list, and
 * `min-dom` by native DOM.
 */
export class SearchPanel {
  static readonly $inject = ['sideTabsProvider', 'eventBus'];

  private readonly _eventBus: EventEmitter<DiagramEventMap>;
  private readonly _items = new Map<string, SearchItem>();
  private _searchInput: HTMLInputElement | null = null;
  private _listEl: HTMLUListElement | null = null;

  constructor(sideTabsProvider: SideTabsRegistrar, eventBus: EventEmitter<DiagramEventMap>) {
    this._eventBus = eventBus;
    this._registerSideTab(sideTabsProvider);
    this._init();
  }

  addOrUpdateItem(item: SearchItem): void {
    if (!item.id) {
      return;
    }
    this._items.set(item.id, item);
    this._render();
  }

  removeItem(id: string): void {
    if (this._items.delete(id)) {
      this._render();
    }
  }

  private _init(): void {
    const onNode = (element: unknown, definition: ElementDefinition): void => {
      this.addOrUpdateItem(this._toItem(element, definition, 'Node', definition.type ?? ''));
    };
    const onLink = (element: unknown, definition: ElementDefinition): void => {
      this.addOrUpdateItem(this._toItem(element, definition, 'Connection', ''));
    };
    // `created` indexes an element; `updated` re-derives its name so a later
    // rename (the label text is often set *after* the node is created) is
    // reflected — otherwise freshly added nodes never appeared in the list.
    this._eventBus.on('node.created', onNode);
    this._eventBus.on('node.updated', onNode);
    this._eventBus.on('link.created', onLink);
    this._eventBus.on('link.updated', onLink);
    this._eventBus.on('node.deleted', (_element: unknown, definition: ElementDefinition) => {
      this.removeItem(definition.id as string);
    });
    this._eventBus.on('link.deleted', (_element: unknown, definition: ElementDefinition) => {
      this.removeItem(definition.id as string);
    });
  }

  private _toItem(
    element: unknown,
    definition: ElementDefinition,
    elementType: string,
    elementSubType: string
  ): SearchItem {
    // Fall back to the id when the caption label has no text yet (a just-added
    // node), so it still shows in the list — matching its on-canvas caption.
    const label = definition.label?.text?.trim();
    return {
      id: definition.id as string,
      name: label || (definition.id as string),
      elementType,
      elementSubType,
      element,
      definition
    };
  }

  private _drawForm(content: HTMLElement | null): void {
    if (!content) {
      return;
    }
    content.replaceChildren();
    const form = document.createElement('div');
    form.id = 'pfdjs-searchpanel';
    this._searchInput = document.createElement('input');
    this._searchInput.className = 'search';
    this._searchInput.placeholder = 'Search';
    this._listEl = document.createElement('ul');
    this._listEl.className = 'list';
    form.append(this._searchInput, this._listEl);
    content.appendChild(form);

    this._searchInput.addEventListener('input', () => this._render());
    this._listEl.addEventListener('click', (event) => {
      const li = (event.target as Element).closest<HTMLElement>('li[data-id]');
      if (li) {
        this._activate(li.getAttribute('data-id') ?? '');
        event.stopImmediatePropagation();
      }
    });
    this._render();
  }

  private _activate(id: string): void {
    const item = this._items.get(id);
    if (!item) {
      return;
    }
    this._eventBus.emit('zoom.to.element', item.element, item.definition);
    const clickEvent =
      `${item.definition.$descriptor.ns.localName.toLowerCase()}.click` as `${ElementClassName}.click`;
    this._eventBus.emit(clickEvent, item.element, item.definition, null);
  }

  private _render(): void {
    if (!this._listEl) {
      return;
    }
    const query = (this._searchInput?.value ?? '').trim().toLowerCase();
    const rows = [...this._items.values()]
      .filter((item) => !query || item.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    this._listEl.replaceChildren();
    for (const item of rows) {
      const li = document.createElement('li');
      li.setAttribute('data-id', item.id);
      li.innerHTML =
        `<h3 class="name"></h3><p><span class="elementType"></span>` +
        `&nbsp;&nbsp;<span class="elementSubType"></span></p>`;
      (li.querySelector('.name') as HTMLElement).textContent = item.name;
      (li.querySelector('.elementType') as HTMLElement).textContent = item.elementType;
      (li.querySelector('.elementSubType') as HTMLElement).textContent = item.elementSubType;
      this._listEl.appendChild(li);
    }
  }

  private _registerSideTab(provider: SideTabsRegistrar): void {
    provider.registerSideTab(
      {
        title: 'Search element',
        icon: 'search',
        action: {
          created: (content) => this._drawForm(content),
          click: () => this._render()
        }
      },
      0
    );
  }
}
