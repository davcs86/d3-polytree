'use strict';

var inherits = require('inherits'),
    baseAddHandler = require('../baseAddHandler');

function AddLabelHandler(drawingRegistry, selection, canvas, modelling, moddle, labels) {
  baseAddHandler.call(this, 'label', drawingRegistry, selection, canvas, modelling);
  this._moddle = moddle;
  this._labels = labels;
}

AddLabelHandler.$inject = [
  'drawingRegistry',
  'selection',
  'canvas',
  'modelling',
  'd3polytree.moddle',
  'labels'
];

module.exports = AddLabelHandler;

inherits(AddLabelHandler, baseAddHandler);
