import type { DiagramModule } from '@d3-polytree/core';
import { SequentialIdGenerator } from '@d3-polytree/canvas';

/**
 * The determinism seam for the visual-regression / a11y net (C8, gated on C9).
 *
 * A fresh {@link SequentialIdGenerator} per render overrides the default random
 * `idGenerator` DI token (last-definition-wins — see the root `CLAUDE.md`), so
 * every generated element id is `node_1`, `link_1`, … in a reproducible order.
 * The rendered *pixels* are unchanged (ids are attributes, not geometry), but
 * the DOM is byte-stable across runs — the precondition for a snapshot net that
 * gates on real diffs rather than on id churn.
 *
 * Spread it *first* into a component's `modules`, ahead of any caller module, so
 * a story that composes its own modules still keeps the deterministic generator
 * unless it deliberately redefines the token.
 */
export function deterministicModules(): DiagramModule[] {
  return [{ idGenerator: ['value', new SequentialIdGenerator()] }];
}
