import type { Canvas } from '@d3-polytree/canvas';

/** A viewport centre point plus the current scale. */
export interface CenterPosition {
  x: number;
  y: number;
  s: number;
}

/**
 * Computes the centre of the canvas viewport (in screen pixels) and the current
 * scale. Ported from `core-v2beta`'s `utils/calculateCenter`.
 */
export class CalculateCenter {
  static readonly $inject = ['canvas'];

  private readonly _canvas: Canvas;

  constructor(canvas: Canvas) {
    this._canvas = canvas;
  }

  getCenterPosition(): CenterPosition {
    const rect = this._canvas.getSVG().node()!.getBoundingClientRect();
    const transform = this._canvas.getTransform();
    return {
      x: rect.width / 2.0,
      y: rect.height / 2.0,
      s: transform.a
    };
  }
}

/** didi module contributing the viewport-centre helper. */
export const calculateCenterModule = {
  __init__: ['calculateCenter'],
  calculateCenter: ['type', CalculateCenter]
};
