'use strict';

var inherits = require('inherits'),
    base = require('../base'),
    isUndefined = require('lodash/lang').isUndefined;

function Nodes(definitions, moddle, drawingRegistry, notifications, eventBus, nodes, modellingLabels) {
  base.call(this, definitions, nodes, drawingRegistry, notifications, eventBus);
  this._moddle = moddle;
  this._nodes = nodes;
  this._modellingLabels = modellingLabels;
}

Nodes.$inject = [
  'd3polytree.definitions',
  'd3polytree.moddle',
  'drawingRegistry',
  'notifications',
  'eventBus',
  'nodes',
  'modellingLabels'
];

module.exports = Nodes;

inherits(Nodes, base);

Nodes.prototype.create = function (parameters) {
  parameters.type = isUndefined(parameters.type) ? 'default' : parameters.type;
  parameters.position = isUndefined(parameters.position) ? {x: 0, y: 0} : parameters.position;
  var newNodePosDef = this._moddle.create('pfdn:Coordinates', parameters.position),
      newNodeDef = this._moddle.create('pfdn:Node', {type: parameters.type, position: newNodePosDef, status: 1});
  this._nodes._builder(newNodeDef.id, newNodeDef);
  // create the associated
  var nodeLabel = this._modellingLabels.create({
    position: {
      x: newNodeDef.position.x + (newNodeDef.size / 2.0),
      y: newNodeDef.position.y + newNodeDef.size + 15
    }
  });
  nodeLabel.text = newNodeDef.id;
  nodeLabel.isReadOnly = true;
  newNodeDef.label = nodeLabel;
  //console.log(newLinkDef);
  this._modellingLabels._labels._builder(nodeLabel.id, nodeLabel) ;
  // return the element
  return newNodeDef;
};