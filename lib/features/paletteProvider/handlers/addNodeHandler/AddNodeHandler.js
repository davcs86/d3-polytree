'use strict';

var inherits = require('inherits'),
    baseAddHandler = require('../baseAddHandler');

function AddNodeHandler(drawingRegistry, selection, canvas, modelling, moddle, nodes) {
  baseAddHandler.call(this, 'node', drawingRegistry, selection, canvas, modelling);
  this._moddle = moddle;
  this._nodes = nodes;
}

AddNodeHandler.$inject = [
  'drawingRegistry',
  'selection',
  'canvas',
  'modelling',
  'd3polytree.moddle',
  'nodes'
];

module.exports = AddNodeHandler;

inherits(AddNodeHandler, baseAddHandler);
