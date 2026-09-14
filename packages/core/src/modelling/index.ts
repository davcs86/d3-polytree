import { labelsModule, linksModule, nodesModule, zonesModule } from '../draw';
import { notificationsModule } from '../features/notifications';
import { ModellingLabels } from './Labels';
import { ModellingZones } from './Zones';
import { ModellingNodes } from './Nodes';
import { ModellingLinks } from './Links';

export { ModellingElement } from './ModellingElement';
export { ModellingLabels } from './Labels';
export { ModellingZones } from './Zones';
export { ModellingNodes } from './Nodes';
export { ModellingLinks } from './Links';
export type { CreateParameters, ModellingModelElement } from './types';

/** didi module contributing the label modelling handler. */
export const modellingLabelsModule = {
  __init__: ['modellingLabels'],
  modellingLabels: ['type', ModellingLabels],
  __depends__: [labelsModule, notificationsModule]
};

/** didi module contributing the zone modelling handler. */
export const modellingZonesModule = {
  __init__: ['modellingZones'],
  modellingZones: ['type', ModellingZones],
  __depends__: [zonesModule, notificationsModule]
};

/** didi module contributing the node modelling handler. */
export const modellingNodesModule = {
  __init__: ['modellingNodes'],
  modellingNodes: ['type', ModellingNodes],
  __depends__: [nodesModule, modellingLabelsModule, notificationsModule]
};

/** didi module contributing the link modelling handler (waypoint routing). */
export const modellingLinksModule = {
  __init__: ['modellingLinks'],
  modellingLinks: ['type', ModellingLinks],
  __depends__: [linksModule, modellingLabelsModule, notificationsModule]
};
