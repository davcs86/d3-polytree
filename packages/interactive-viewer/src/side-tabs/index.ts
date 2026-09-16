/**
 * @d3-polytree/side-tabs — a collapsible tabbed side panel feature.
 *
 * Modernised (B6) from the 2017 `min-dom`/`lodash` source to TypeScript + native
 * DOM. Ships a didi module (`sideTabsModule`) that the editor composes.
 */
import { SideTabs } from './SideTabs';
import { SideTabsProvider } from './SideTabsProvider';

export { SideTabs } from './SideTabs';
export { SideTabsProvider } from './SideTabsProvider';
export type { SideTabAction, SideTabEntry } from './SideTabsProvider';

/** didi module contributing the side-tabs panel and its provider. */
export const sideTabsModule = {
  __init__: ['sideTabs', 'sideTabsProvider'],
  sideTabs: ['type', SideTabs],
  sideTabsProvider: ['type', SideTabsProvider]
};

export default sideTabsModule;
