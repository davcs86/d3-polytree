import { CommandStack } from './CommandStack';

export { CommandStack } from './CommandStack';
export type { CommandContext, CommandHandler } from './CommandHandler';

/**
 * didi module contributing the transactional {@link CommandStack} service.
 *
 * Eagerly instantiated (`__init__`) so it subscribes to `d3canvas.init` before
 * `Diagram` emits it — the boot latch (see {@link CommandStack}) depends on that
 * ordering. Compose it into a component's module list so `Modelling` and the
 * interaction features can resolve `commandStack`.
 */
export const commandStackModule = {
  __init__: ['commandStack'],
  commandStack: ['type', CommandStack]
};
