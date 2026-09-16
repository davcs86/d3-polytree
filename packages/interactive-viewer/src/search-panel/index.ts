/**
 * @d3-polytree/search-panel — a searchable index of diagram elements.
 *
 * Modernised (B6) from the 2017 `list.js`/`min-dom` source to TypeScript + ESM
 * with a native filter/sort list. Ships a didi module (`searchPanelModule`) that
 * registers a "Search element" side tab.
 */
import { SearchPanel } from './SearchPanel';

export { SearchPanel } from './SearchPanel';
export type { SideTabRegistration, SideTabsRegistrar } from './SearchPanel';

/** didi module contributing the search panel. */
export const searchPanelModule = {
  __init__: ['searchPanel'],
  searchPanel: ['type', SearchPanel]
};

export default searchPanelModule;
