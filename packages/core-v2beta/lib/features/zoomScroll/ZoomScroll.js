'use strict';

/**
 * Enables the zoom.
 *
 * @class
 * @constructor
 *
 * @param {Zoom} zoom
 */
function ZoomScroll(zoom) {
  zoom.setZoomable(true);
}

ZoomScroll.$inject = ['zoom'];

module.exports = ZoomScroll;
