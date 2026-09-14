'use strict';

var BaseElement = require('../baseElement'),
    inherits = require('inherits')
    ;

/**
 * The label drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Labels} labels
 * @param {Canvas} canvas
 * @param {EventEmitter} eventBus
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 * @param {DrawingRegistry} drawingRegistry
 */
function Labels(labels, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry) {
  
  BaseElement.call(this, 'label', labels, canvas, eventBus, elementBuilder, elementRegistry, drawingRegistry);
  
}

inherits(Labels, BaseElement);

Labels.$inject = [
  'd3polytree.definitions.label',
  'canvas',
  'eventBus',
  'elementBuilder',
  'elementRegistry',
  'drawingRegistry'
];

module.exports = Labels;

Labels.prototype._createElement = function (label, definition) {

  var translate = 'translate(';

  translate += definition.position.x;
  translate += ',';
  translate += definition.position.y;
  translate += ')';

  label
    .attr('x', definition.position.x)
    .attr('y', definition.position.y)
    .attr('transform', translate);
  
  label
    .select('.innerElement')
    .attr('transform', 'translate(3.66,3.66)')
    .append('text')
    .style('font-family', '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif')
    .attr('dominant-baseline', 'hanging')
    .attr('fill', definition.color)
    .style('font-size', definition.fontSize + 'px')
    .text(definition.text);
  
};

Labels.prototype._updateElement = function (label, definition) {

  var translate = 'translate(';

  translate += definition.position.x;
  translate += ',';
  translate += definition.position.y;
  translate += ')';

  label
    .attr('x', definition.position.x)
    .attr('y', definition.position.y)
    .attr('transform', translate);

  label
    .select('.innerElement')
    .select('text')
    //.attr('text-anchor', 'middle')
    .attr('fill', definition.color)
    .style('font-size', definition.fontSize + 'px')
    .text(definition.text);

};
