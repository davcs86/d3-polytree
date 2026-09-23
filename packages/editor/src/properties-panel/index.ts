/**
 * @d3-polytree/properties-panel — the editor's element-properties panel.
 *
 * Modernised (B6) from the 2017 jQuery/spectrum/scroll-tabs source to TypeScript
 * + ESM with native DOM: jQuery is gone, the colour entry uses a native
 * `<input type="color">`, and the `scroll-tabs` widget is replaced by native
 * click-to-select tabs. Ships three didi modules (entry factory, PFDN provider,
 * panel) for the editor to compose.
 */
export { EntryFactory, entryFactoryModule } from './EntryFactory';
export type { EntryOptions, EntryResource, SelectOption } from './EntryFactory';
export { PfdnPropertiesProvider, pfdnPropertiesProviderModule } from './PfdnPropertiesProvider';
export type {
  IconMap,
  PropertiesGroup,
  PropertiesProvider,
  PropertiesTab
} from './PfdnPropertiesProvider';
export { PropertiesPanel } from './PropertiesPanel';
export type { SideTabRegistration, SideTabsRegistrar } from './PropertiesPanel';
export type { Definition } from './utils';

import { PropertiesPanel } from './PropertiesPanel';

/** didi module contributing the properties panel (composes with the provider). */
export const propertiesPanelModule = {
  __init__: ['propertiesPanel'],
  propertiesPanel: ['type', PropertiesPanel]
};

export default propertiesPanelModule;
