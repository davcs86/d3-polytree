'use strict';

var inherits = require('inherits'),
    base = require('../base'),
    isUndefined = require('lodash/lang').isUndefined;

function Labels(definitions, moddle, drawingRegistry, notifications, eventBus, labels) {
  base.call(this, definitions, labels, drawingRegistry, notifications, eventBus);
  this._moddle = moddle;
  this._labels = labels;
}

Labels.$inject = [
  'd3polytree.definitions',
  'd3polytree.moddle',
  'drawingRegistry',
  'notifications',
  'eventBus',
  'labels'
];

module.exports = Labels;

inherits(Labels, base);

Labels.prototype.create = function (parameters) {
  parameters.position = isUndefined(parameters.position) ? {x: 0, y: 0} : parameters.position;
  var newNodePosDef = this._moddle.create('pfdn:Coordinates', parameters.position);
  var newNodeDef = this._moddle.create('pfdn:Label', {position: newNodePosDef, status: 1});
  this._labels.appendElement(newNodeDef);
  // console.log(newNodeDef.id+"-");
  newNodeDef.text = newNodeDef.id;
  // console.log(newNodeDef);
  this._labels.appendElement(newNodeDef);
  // return the element
  return newNodeDef;
};