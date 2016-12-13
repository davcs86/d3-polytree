'use strict';

var BaseElement = require('../baseElement'),
  inherits = require('inherits')
  ;

/**
 * The zones drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Zones} zone
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 */
function Zones(zones, canvas, eventBus, elementBuilder, elementRegistry, labels) {

  this._labels = labels;
  BaseElement.call(this, 'zone', zones, canvas, eventBus, elementBuilder, elementRegistry);

}

inherits(Zones, BaseElement);

Zones.$inject = [
  'd3polytree.definitions.zone',
  'canvas',
  'eventBus',
  'elementBuilder',
  'elementRegistry',
  'labels'
];

module.exports = Zones;

Zones.prototype._createElement = function(zone, definition){
  console.log(zone);
  zone
    .append("rect")
    .attr("x", definition.position.x)
    .attr("y", definition.position.y)
    .attr("height", definition.height)
    .attr("width", definition.width)
    .style("stroke", definition.border.lineColor)
    .style("fill", definition.fillColor)
    .style("opacity", definition.opacity)
    .style("stroke-width", definition.border.lineWidth);

  this._labels.appendElement(definition.label);
};
