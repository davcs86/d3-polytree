'use strict';

var inherits = require('inherits'),
    baseAddHandler = require('../baseAddHandler');

function AddNodeHandler(drawingRegistry, selection, canvas, modelling) {
  baseAddHandler.call(this, 'node', drawingRegistry, selection, canvas, modelling);
}

AddNodeHandler.$inject = [
  'drawingRegistry',
  'selection',
  'canvas',
  'modelling'
];

module.exports = AddNodeHandler;

inherits(AddNodeHandler, baseAddHandler);
