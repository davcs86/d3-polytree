'use strict';

var d3 = require('d3'),
  valuesIn = require('lodash/object').valuesIn
  ;

/**
 * Return the center's coordinates.
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function CalculateCenter(canvas, elementRegistry) {
  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
}

CalculateCenter.$inject = [
  'canvas',
  'elementRegistry'
];

module.exports = CalculateCenter;

CalculateCenter.prototype._getElemOfReference = function () {
  // var elements = valuesIn(this._elementRegistry.getAll()),
  //   pointOfRef = false;
  //
  // if (elements.length > 0) {
  //   pointOfRef = d3.select(elements[0].node().parentNode);
  // } else {
  return this._canvas.getDrawingLayer();
  // }
  //
  // return pointOfRef;
};

CalculateCenter.prototype.getCenterPosition = function () {
  var elemOfRef = this._getElemOfReference(),
    position = this._canvas.getContainer().getBoundingClientRect(),
    dLayerRect = elemOfRef.node().getBoundingClientRect(),

    elemOfRefTransform = this._canvas.getTransform(elemOfRef),
    canvasTransform = this._canvas.getTransform(),
    translateX = elemOfRefTransform.e,
    translateY = elemOfRefTransform.f,
    scale = canvasTransform.a;

  var x = translateX + ((position.left + position.width / 2.0) - dLayerRect.left);
  var y = translateY + ((position.top + position.height / 2.0) - dLayerRect.top);

  console.log('x: ', x);
  console.log('y: ', y);

  // return {
  //   x: -1.0 * (dLayerRect.left - (translateX * scale) - (position.left + (position.width / 2))) / scale,
  //   y: -1.0 * (dLayerRect.top - (translateY * scale) - (position.top + (position.height / 2))) / scale,
  //   s: scale
  // };
  return {
    x: x,
    y: y,
    s: scale
  };
};