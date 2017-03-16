'use strict';

var inherits = require('inherits'),
  base = require('../base'),
  isUndefined = require('lodash/lang').isUndefined;

function Labels(definitions, moddle, elementRegistry, notifications, labels) {
  base.call(this, definitions, labels, elementRegistry, notifications);
  this._moddle = moddle;
  this._labels = labels;
}

Labels.$inject = [
  'd3polytree.definitions',
  'd3polytree.moddle',
  'elementRegistry',
  'notifications',
  'labels'
];

module.exports = Labels;

inherits(Labels, base);

Labels.prototype.create = function (parameters) {
  parameters.position = isUndefined(parameters.position) ? {x: 0, y: 0} : parameters.position;
  var newNodePosDef = this._moddle.create('pfdn:Coordinates', parameters.position),
    newNodeDef = this._moddle.create('pfdn:Label', {position: newNodePosDef});
  this._labels._builder(newNodeDef);
  newNodeDef.set('text', newNodeDef.id);
  // return the element
  return newNodeDef;
};