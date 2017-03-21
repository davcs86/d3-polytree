'use strict';

var BaseElement = require('../baseElement'),
  inherits = require('inherits'),
  d3 = require('d3'),
  forEach = require('lodash/collection').forEach
  ;

/**
 * The label drawing module.
 *
 * @class
 * @constructor
 *
 * @param {Labels} labels
 * @param {Canvas} canvas
 * @param {EventBus} eventBus
 * @param {ElementBuilder} elementBuilder
 * @param {ElementRegistry} elementRegistry
 */
function Labels(labels, canvas, eventBus, elementBuilder, elementRegistry) {
  
  BaseElement.call(this, 'label', labels, canvas, eventBus, elementBuilder, elementRegistry);
  
}

inherits(Labels, BaseElement);

Labels.$inject = [
  'd3polytree.definitions.label',
  'canvas',
  'eventBus',
  'elementBuilder',
  'elementRegistry'
];

module.exports = Labels;

Labels.prototype._setElementsData = function () {
  return this._elementsContainer
    .selectAll('.' + this._className + 'Item')
    .data(this.getAll(), function (d) {
      var key = {
        'id_': d.id,
        'txt_': d.text,
        'clr_': d.color,
        'fS_': d.fontSize
      };
      return key;
    });
};

Labels.prototype._createElement = function (label, definition) {
  d3.select(label.node().parentNode)
    .attr('x', function (d) {
      return d.position.x;
    })
    .attr('y', function (d) {
      return d.position.y;
    })
    .attr('transform', function (d) {
      return 'translate(' + d.position.x + ',' + d.position.y + ')';
    });
  
  label
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('fill', definition.color)
    .style(
      'font-size', definition.fontSize + 'px'
    )
    .text(definition.text);
  
};

Labels.prototype._updateElement = function (label, definition) {


  label
    .select('text')
    .attr('text-anchor', 'middle')
    .attr('fill', definition.color)
    .style(
      'font-size', definition.fontSize + 'px'
    )
    .text(definition.text);



  // update outline

};
