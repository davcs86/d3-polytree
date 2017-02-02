'use strict';

var inherits = require('inherits'),
  baseAddHandler = require('../baseAddHandler');

function AddNodeHandler(elementRegistry, selection, canvas, modelling, moddle, nodes) {
  baseAddHandler.call(this, 'node', elementRegistry, selection, canvas, modelling);
  this._moddle = moddle;
  this._nodes = nodes;
}

AddNodeHandler.$inject = [
  'elementRegistry',
  'selection',
  'canvas',
  'modelling',
  'd3polytree.moddle',
  'nodes'
];

module.exports = AddNodeHandler;

inherits(AddNodeHandler, baseAddHandler);
