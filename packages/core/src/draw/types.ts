import type { Selection } from 'd3-selection';
import type { RegisteredElement } from '@d3-polytree/canvas';

/**
 * A diagram element definition (a moddle model element) as consumed by the draw
 * layer: it carries an id and moddle's `get`/`set` accessors.
 */
export interface DiagramElement extends RegisteredElement {
  id?: string;
  $type?: string;
  get(name: string): unknown;
  set(name: string, value: unknown): void;
}

/** A `<g>` container selection (no bound datum). */
export type ContainerSelection = Selection<SVGGElement, unknown, null, undefined>;

/** A `<g>` drawing selection bound to its {@link DiagramElement} datum. */
export type DrawingSelection = Selection<SVGGElement, DiagramElement, null, undefined>;
