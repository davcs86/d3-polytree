'use strict';

var inherits = require('inherits'),
  base = require('../base'),
  isUndefined = require('lodash/lang').isUndefined;

function Nodes(definitions, moddle, elementRegistry, notifications, nodes) {
  base.call(this, definitions, nodes, elementRegistry, notifications);
  this._moddle = moddle;
  this._nodes = nodes;
}

Nodes.$inject = [
  'd3polytree.definitions',
  'd3polytree.moddle',
  'elementRegistry',
  'notifications',
  'nodes'
];

module.exports = Nodes;

inherits(Nodes, base);

Nodes.prototype.create = function (parameters) {
  parameters.type = isUndefined(parameters.type) ? 'default' : parameters.type;
  parameters.position = isUndefined(parameters.position) ? {x: 0, y: 0} : parameters.position;
  var newNodePosDef = this._moddle.create('pfdn:Coordinates', parameters.position),
    newNodeDef = this._moddle.create('pfdn:Node', {type: parameters.type, position: newNodePosDef});
  this._nodes._builder(newNodeDef);
  // return the element
  return newNodeDef;
};