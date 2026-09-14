'use strict';

var inherits = require('inherits'),
    base = require('../base');

function Diagram(definitions, moddle, drawingRegistry, notifications) {
  base.call(this, definitions, null, drawingRegistry, notifications);
  this._moddle = moddle;
}

Diagram.$inject = [
  'd3polytree.definitions',
  'd3polytree.moddle',
  'drawingRegistry',
  'notifications'
];

module.exports = Diagram;

inherits(Diagram, base);

Diagram.prototype.create = function () {
  console.error('Method not allowed.');
};

Diagram.prototype.delete = function () {
  console.error('Method not allowed.');
};