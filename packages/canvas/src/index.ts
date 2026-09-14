/**
 * @d3-polytree/canvas — scaffold placeholder.
 *
 * Real content (the base SVG canvas: Canvas, ElementRegistry, ElementBuilder,
 * SvgExportingUtils, de-duplicated from d3-canvas and v2.0-beta lib/base/core)
 * is imported in Track B phase B2. This placeholder exists so the monorepo's
 * build / test / typecheck / lint pipeline is wired and green from B0 onward.
 */

export const PACKAGE_NAME = '@d3-polytree/canvas';

export interface Size {
  width: number;
  height: number;
}

/** Create a bare SVG root sized to `size`. Placeholder for the real Canvas. */
export function createSvg(size: Size): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size.width));
  svg.setAttribute('height', String(size.height));
  svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
  return svg;
}
