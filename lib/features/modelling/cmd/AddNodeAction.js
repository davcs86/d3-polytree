'use strict';

var isUndefined = require('lodash/lang').isUndefined;

/**
 * Selection description
 *
 * @class
 * @constructor
 *
 * @param {Node} nodes
 * @param {PfdnModdle} moddle
 */

function AddNodeAction(nodes, moddle) {

  this._nodes = nodes;
  this._moddle = moddle;

}

AddNodeAction.$inject = [
  'nodes',
  'd3polytree.moddle'
];

module.exports = AddNodeAction;

AddNodeAction.prototype.addNode = function(position, type){
  type = isUndefined(type) ? 'default': type;
  position = isUndefined(position) ? {x: 0, y: 0}: position;
  var newNodePosDef = this._moddle.create('pfdn:Coordinates', position),
    newNodeDef = this._moddle.create('pfdn:Node', {type: type, position: newNodePosDef});
  this._nodes._builder(newNodeDef);
  // return the element
  return newNodeDef;
};