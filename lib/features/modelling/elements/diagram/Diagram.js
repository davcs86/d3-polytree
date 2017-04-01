'use strict';

var inherits = require('inherits'),
  base = require('../base');

function Diagram(definitions, moddle, elementRegistry, notifications) {
  base.call(this, definitions, null, elementRegistry, notifications);
  this._moddle = moddle;
}

Diagram.$inject = [
  'd3polytree.definitions',
  'd3polytree.moddle',
  'elementRegistry',
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