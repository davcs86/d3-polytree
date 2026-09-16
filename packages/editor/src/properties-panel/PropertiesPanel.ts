import type EventEmitter from 'eventemitter3';
import type { EntryResource } from './EntryFactory';
import type { PropertiesProvider } from './PfdnPropertiesProvider';
import { debounce, deepGet, deepSet, type Definition } from './utils';

/** The side-tab registration surface the panel needs (structural). */
export interface SideTabRegistration {
  title?: string;
  iconClassName?: string;
  action: {
    created?: (content: HTMLElement | null) => void;
    [gesture: string]: ((content: HTMLElement | null) => void) | undefined;
  };
}
export interface SideTabsRegistrar {
  registerSideTab(tab: SideTabRegistration, index?: number): void;
}

/** A selection entry as delivered by the core `selection.changed` event. */
interface SelectionEntry {
  definition: Definition;
}

interface TrackedEntry {
  scope: EntryResource;
  definition: Definition;
  formNode: HTMLElement;
}

/** Parse an HTML fragment into its first element. */
function fromHtml(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
}

const FORM_CONTROLS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * The editor properties panel: a tabbed editor for the selected element's
 * model properties. Ported from `@d3-polytree/properties-panel`'s
 * `PropertiesPanel.js`, de-jQuery-ed onto native DOM; the `scroll-tabs` widget
 * is replaced by native click-to-select tabs.
 */
export class PropertiesPanel {
  static readonly $inject = [
    'sideTabsProvider',
    'eventBus',
    'propertiesProvider',
    'd3polytree.definitions.settings'
  ];

  private readonly _eventBus: EventEmitter;
  private readonly _propertiesProvider: PropertiesProvider;
  private readonly _diagramSettings: Definition;
  private _entries: Record<string, TrackedEntry> = {};

  private _container: HTMLElement | null = null;
  private _tabsEl: HTMLElement | null = null;
  private _contentsEl: HTMLElement | null = null;

  constructor(
    sideTabsProvider: SideTabsRegistrar,
    eventBus: EventEmitter,
    propertiesProvider: PropertiesProvider,
    diagramSettings: Definition
  ) {
    this._eventBus = eventBus;
    this._propertiesProvider = propertiesProvider;
    this._diagramSettings = diagramSettings;
    this._registerSideTab(sideTabsProvider);
    this._registerSelectionListener();
  }

  private _registerSideTab(provider: SideTabsRegistrar): void {
    provider.registerSideTab(
      {
        title: 'Properties',
        iconClassName: 'icon-sliders',
        action: { created: (content) => this._drawPanel(content) }
      },
      1
    );
  }

  private _registerSelectionListener(): void {
    this._eventBus.on(
      'selection.changed',
      (oldSelection: SelectionEntry[], newSelection: SelectionEntry[]) => {
        let selected: Definition = this._diagramSettings;
        if (
          newSelection.length === 1 &&
          (oldSelection.length !== 1 ||
            oldSelection[0].definition.id !== newSelection[0].definition.id)
        ) {
          selected = newSelection[0].definition;
        }
        this._update(selected);
      }
    );
  }

  private _drawPanel(content: HTMLElement | null): void {
    if (!content) {
      return;
    }
    this._drawContainer(content);
    this._update(this._diagramSettings);
  }

  private _drawContainer(content: HTMLElement): void {
    this._container = fromHtml(PropertiesPanel.HTML_MARKUP);
    content.insertBefore(this._container, content.firstChild);
    this._tabsEl = this._container.querySelector('.tab-sheets');
    this._contentsEl = this._container.querySelector('.pfdjs-pp-contents');

    this._container.addEventListener('click', (event) => {
      const tab = (event.target as Element).closest<HTMLElement>('.tab-sheet');
      if (tab) {
        this._selectTab(tab.getAttribute('data-tab-target'));
        event.stopImmediatePropagation();
      }
    });
    this._registerInputChangeHandlers();
  }

  private _registerInputChangeHandlers(): void {
    const container = this._container;
    if (!container) {
      return;
    }
    // debounce keystroke updates on text inputs/areas; selects fire on change.
    const debouncedApply = debounce((target: HTMLElement) => this._applyChange(target), 300);
    container.addEventListener('input', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        debouncedApply(target);
      }
    });
    container.addEventListener('change', (event) => {
      const target = event.target as HTMLElement;
      if (FORM_CONTROLS.has(target.tagName)) {
        this._applyChange(target);
      }
    });
    this._eventBus.on(
      'PropertiesPanel.propertyChanged',
      (propertyId: string, definition: Definition) => this._applyChangeByProperty(propertyId, definition)
    );
  }

  private _applyChange(target: HTMLElement): void {
    const entryId = target.getAttribute('name');
    if (!entryId) {
      return;
    }
    this._commit(entryId, (target as HTMLInputElement).value);
  }

  private _applyChangeByProperty(propertyId: string, definition: Definition): void {
    this._commit(propertyId, deepGet(definition, propertyId));
  }

  private _commit(entryId: string, newValue: unknown): void {
    const entry = this._entries[entryId];
    if (!entry) {
      return;
    }
    const props: Record<string, unknown> = {};
    deepSet(props, entryId, newValue);
    entry.scope.set(entry.definition, props);
    this._propertiesProvider.updateDrawing(entry.definition);
  }

  private _selectTab(tabId: string | null): void {
    this._tabsEl?.querySelectorAll<HTMLElement>('.tab-sheet').forEach((tab) => {
      tab.classList.toggle('tab-sheet-active', tab.getAttribute('data-tab-target') === tabId);
    });
    this._contentsEl?.querySelectorAll<HTMLElement>('.pfdjs-pp-content').forEach((content) => {
      content.classList.toggle('open', content.getAttribute('data-tab-target') === tabId);
    });
  }

  private _update(definition: Definition | undefined): void {
    if (this._tabsEl && this._contentsEl) {
      this._tabsEl.replaceChildren();
      this._contentsEl.replaceChildren();
    }
    if (definition) {
      this._drawEntries(definition);
    }
  }

  private _drawEntries(definition: Definition): void {
    if (!this._tabsEl || !this._contentsEl) {
      return;
    }
    const tabs = this._propertiesProvider.getTabs(definition);
    const renderedTabs: { id: string; label: string }[] = [];
    this._entries = {};

    for (const tab of tabs) {
      const content = fromHtml(`<div class="pfdjs-pp-content" data-tab-target="${tab.id}"></div>`);
      let tabHasContent = false;

      for (const group of tab.groups) {
        if (group.entries.length === 0) {
          continue;
        }
        const groupContent = fromHtml(
          `<div class="pfdjs-pp-content-group" data-group-target="${group.id}">` +
            `<div class="tab-content-group-title">${group.label}</div></div>`
        );
        for (const entry of group.entries) {
          const entryNode = fromHtml(`<div>${entry.html}</div>`);
          groupContent.appendChild(entryNode);
          this._entries[entry.id] = { scope: entry, definition, formNode: entryNode };
        }
        content.appendChild(groupContent);
        tabHasContent = true;
      }

      if (tabHasContent) {
        this._contentsEl.appendChild(content);
        renderedTabs.push({ id: tab.id, label: tab.label });
      }
    }

    // populate each entry from the model
    Object.values(this._entries).forEach((entry) => entry.scope.get(entry.definition, entry.formNode));

    // draw the tab strip
    let firstTab: string | null = null;
    for (const tab of renderedTabs) {
      firstTab ??= tab.id;
      this._tabsEl.appendChild(
        fromHtml(
          `<li class="tab-sheet" data-tab-target="${tab.id}"><a href="#">${tab.label}</a></li>`
        )
      );
    }
    this._selectTab(firstTab);
  }

  static readonly HTML_MARKUP =
    '<div id="pfdjs-pp-container">' +
    '<div class="pfdjs-pp-tabs"><ul class="tab-sheets"></ul></div>' +
    '<div class="pfdjs-pp-contents"></div>' +
    '</div>';
}
