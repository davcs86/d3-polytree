'use strict';

var inherits = require('inherits'),
  baseAddHandler = require('../baseAddHandler');

function AddLabelHandler(elementRegistry, selection, canvas, modelling, moddle, labels) {
  baseAddHandler.call(this, 'label', elementRegistry, selection, canvas, modelling);
  this._moddle = moddle;
  this._labels = labels;
}

AddLabelHandler.$inject = [
  'elementRegistry',
  'selection',
  'canvas',
  'modelling',
  'd3polytree.moddle',
  'labels'
];

module.exports = AddLabelHandler;

inherits(AddLabelHandler, baseAddHandler);
