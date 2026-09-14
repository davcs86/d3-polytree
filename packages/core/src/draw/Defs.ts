import type { Selection } from 'd3-selection';
import type { Canvas } from '@d3-polytree/canvas';

/** The shared `<defs>` element selection. */
export type DefsSelection = Selection<SVGDefsElement, unknown, null, undefined>;

/** Create (and return) a `<defs>` element on the canvas SVG. */
export function createDefs(canvas: Canvas): DefsSelection {
  return canvas.getSVG().append('defs');
}
createDefs.$inject = ['canvas'];
