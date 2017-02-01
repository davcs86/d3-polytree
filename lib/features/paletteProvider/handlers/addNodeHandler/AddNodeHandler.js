'use strict';

var d3 = require('d3'),
  valuesIn = require('lodash/object').valuesIn;

function AddNode(addNodeAction, elementRegistry, selection, drag, canvas){
  this._addNodeAction = addNodeAction;
  this._elementRegistry = elementRegistry;
  this._selection = selection;
  this._drag = drag;
  this._canvas = canvas;
}

AddNode.$inject = [
  'addNodeAction',
  'elementRegistry',
  'selection',
  'drag',
  'canvas'
];

module.exports = AddNode;

AddNode.prototype._getElemOfReference = function(){
  var elements = valuesIn(this._elementRegistry.getAll()),
    pointOfRef = false;

  if (elements.length > 0){
    pointOfRef = d3.select(elements[0].node().parentNode);
  } else {
    pointOfRef = this._canvas.getDrawingLayer();
  }

  return pointOfRef;
};

AddNode.prototype.addNode = function(position, type){
  // fix position
  var elemOfRef = this._getElemOfReference(),
    dLayerRect = elemOfRef.node().getBoundingClientRect(),
    elemOfRefTransform = this._canvas.getTransform(elemOfRef),
    canvasTransform = this._canvas.getTransform(),
    translateX = elemOfRefTransform.e,
    translateY = elemOfRefTransform.f,
    scale = canvasTransform.a,
    newPosition = {
      x : -1.0 * (dLayerRect.left - (translateX * scale) - position.x) / scale,
      y : -1.0 * (dLayerRect.top - (translateY * scale) - position.y) / scale
    },
    nodeCreatedDef = this._addNodeAction.addNode({x: newPosition.x, y: newPosition.y}, type),
    nodeCreatedElem = this._elementRegistry.get(nodeCreatedDef.id);

  // select it
  this._selection._selectElement(nodeCreatedElem, nodeCreatedDef, {});
};

AddNode.prototype.moveNodes = function(delta){
  var currentTransform = this._canvas.getTransform();
  var scale = currentTransform.a;
  this._drag._applyOffsetToSelected(delta.x/scale, delta.y/scale);
};
