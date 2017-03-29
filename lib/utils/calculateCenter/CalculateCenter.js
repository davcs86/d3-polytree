'use strict';

/**
 * Return the center's coordinates.
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function CalculateCenter(canvas) {
  this._canvas = canvas;
}

CalculateCenter.$inject = [
  'canvas'
];

module.exports = CalculateCenter;

CalculateCenter.prototype.getCenterPosition = function () {
  var svg = this._canvas.getSVG().node().getBoundingClientRect(),
    canvasTransform = this._canvas.getTransform()
  ;
  return {
    x: svg.width / 2.0,
    y: svg.height / 2.0,
    s: canvasTransform.a
  };
};