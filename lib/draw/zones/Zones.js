'use strict';

var BaseElement = require('../baseElement'),
    inherits = require('inherits'),
    d3 = require('d3')
    ;

/**
 * The zones drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Zones} zones
 * @param {Canvas} canvas
 * @param {EventEmitter} eventBus
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 * @param {DrawingRegistry} drawingRegistry
 */
function Zones(zones, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry) {
  BaseElement.call(this, 'zone', zones, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry);
}

inherits(Zones, BaseElement);

Zones.$inject = [
  'd3polytree.definitions.zone',
  'canvas',
  'eventBus',
  'elementBuilder',
  'elementRegistry',
  'drawingRegistry'
];

module.exports = Zones;

Zones.prototype._createElement = function (zone, definition) {
  zone
    .attr('x', function (d) {
      return d.position.x;
    })
    .attr('y', function (d) {
      return d.position.y;
    })
    .attr('transform', function (d) {
      return 'translate(' + d.position.x + ',' + d.position.y + ')';
    });
  
  zone
    .append('rect')
    .attr('height', definition.height)
    .attr('width', definition.width)
    .style('stroke', definition.border.lineColor)
    .style('fill', definition.fillColor)
    .style('opacity', definition.opacity)
    .style('stroke-width', definition.border.lineWidth);
  
};

Zones.prototype._drawContainer = function () {
  if (this._elementsContainer) {
    // delete previous elements
    this._elementsContainer.remove();
  }
  this._elementsContainer = this._canvas.getDrawingLayer()
    .insert('g', ':first-child') // send to the background
    .attr('class', this._className+'-group');
};
