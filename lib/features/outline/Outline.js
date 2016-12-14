'use strict';

/**
 * Outline description
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 */

function Outline(canvas, eventBus) {

  this._canvas = canvas;
  this._eventBus = eventBus;

  this._init();
}

Outline.$inject = [
  'canvas',
  'eventBus',
];

module.exports = Outline;

Outline.prototype._getElemBBox = function(element){
  return element.node().getBBox();
};

Outline.prototype._init = function () {
  this._eventBus.on('node.created', function(element){
    // add the outline to every node created
    var elemSize = this._getElemBBox(element);
    element
      .append('rect')
      .attr('class', 'element-outline')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', "green")
      .attr('width', elemSize.width)
      .style('height', elemSize.height);
  }, this);
};