'use strict';

var d3 = require('d3'),
  valuesIn = require('lodash/object').valuesIn,
  isUndefined = require('lodash/lang').isUndefined;

function BaseAddHandler(className, elementRegistry, selection, canvas, modelling) {
  this._className = className;
  this._elementRegistry = elementRegistry;
  this._selection = selection;
  this._canvas = canvas;
  this._modelling = modelling;
}

module.exports = BaseAddHandler;

BaseAddHandler.prototype._getElemOfReference = function () {
  var elements = valuesIn(this._elementRegistry.getAll()),
    pointOfRef = false;
  
  if (elements.length > 0) {
    pointOfRef = d3.select(elements[0].node().parentNode);
  } else {
    pointOfRef = this._canvas.getDrawingLayer();
  }
  
  return pointOfRef;
};

BaseAddHandler.prototype._calculatePosition = function () {
  var elemOfRef = this._getElemOfReference(),
    position = this._canvas.getContainer().getBoundingClientRect(),
    dLayerRect = elemOfRef.node().getBoundingClientRect(),
    elemOfRefTransform = this._canvas.getTransform(elemOfRef),
    canvasTransform = this._canvas.getTransform(),
    translateX = elemOfRefTransform.e,
    translateY = elemOfRefTransform.f,
    scale = canvasTransform.a;
  
  return {
    x: -1.0 * (dLayerRect.left - (translateX * scale) - (position.left + (position.width / 2))) / scale,
    y: -1.0 * (dLayerRect.top - (translateY * scale) - (position.top + (position.height / 2))) / scale
  };
};

BaseAddHandler.prototype._create = function () {
  return this._modelling.doAction(this._className, 'create', [].slice.call(arguments));
};

BaseAddHandler.prototype.append = function (parameters) {
  parameters = isUndefined(parameters) ? {} : parameters;
  parameters.position = this._calculatePosition();
  var newElementDef = this._create(parameters),
    newElement = this._elementRegistry.get(newElementDef.id);
  // select it
  this._selection._selectElement(newElement, newElementDef, {});
};