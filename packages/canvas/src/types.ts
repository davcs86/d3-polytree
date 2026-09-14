import type { Selection } from 'd3-selection';

/** Options accepted by {@link Canvas}. */
export interface CanvasConfig {
  /** Host element the canvas is appended to. Defaults to `document.body`. */
  container?: HTMLElement;
  /** Width of the canvas container. A number is treated as pixels. */
  width?: number | string;
  /** Height of the canvas container. A number is treated as pixels. */
  height?: number | string;
}

/** A diagram element tracked by {@link ElementRegistry}. */
export interface RegisteredElement {
  id?: string;
  [key: string]: unknown;
}

/** Pixel size of the canvas container. */
export interface CanvasSize {
  width: number;
  height: number;
}

/** Normalized 2D affine transform (scale a/d, translate e/f). */
export interface TransformMatrix {
  a: number;
  d: number;
  e: number;
  f: number;
}

export type SvgSelection = Selection<SVGSVGElement, unknown, null, undefined>;
export type GroupSelection = Selection<SVGGElement, unknown, null, undefined>;
