'use strict';

var BaseElement = require('../baseElement'),
    inherits = require('inherits'),
    d3 = require('d3')
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

Labels.prototype._setElementsData = function () {
  return this._elementsContainer
    .selectAll('.' + this._className + 'Item')
    .data(this.getAll(), function (d) {
      return {
        'id_': d.id,
        'txt_': d.text,
        'clr_': d.color,
        'fS_': d.fontSize
      };
    });
};

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
    .append('text')
    .attr('class', 'helv')
    .attr('text-anchor', 'middle')
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
    .attr('text-anchor', 'middle')
    .attr('fill', definition.color)
    .style('font-size', definition.fontSize + 'px')
    .text(definition.text);

};
