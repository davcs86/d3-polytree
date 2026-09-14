import type { Zoom } from './zoom';

/**
 * Enables interactive (scroll/drag) zooming by marking the {@link Zoom}
 * behaviour zoomable. Ported from `core-v2beta`'s
 * `features/zoomScroll/ZoomScroll.js`.
 */
export class ZoomScroll {
  static readonly $inject = ['zoom'];

  constructor(zoom: Zoom) {
    zoom.setZoomable(true);
  }
}
