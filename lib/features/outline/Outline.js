'use strict';

var d3 = require('d3');

require('./style.scss');

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

Outline.prototype._createOutline = function(element, definition){
  // add the outline to every node created
  var that = this,
    type = definition.$descriptor.ns.localName.toLowerCase(),
    elemSize = this._getElemBBox(element),
    outline = d3.select(element.node().parentNode)
      .append('rect')
      .attr('class', 'element-outline')
      .attr('x', function(){
        return (type === 'label')? elemSize.width / -2 : 0;
      })
      .attr('y', function(){
        return (type === 'label')? elemSize.height / -1.33333333 : 0;
      })
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 0)
      .attr('stroke-dasharray', '3')
      .attr('width', elemSize.width + 6)
      .attr('height', elemSize.height + 6);
    that._eventBus.emit('outline.created', outline);
};

Outline.prototype._init = function () {
  this._eventBus.on('node.created', this._createOutline, this);
  this._eventBus.on('label.created', this._createOutline, this);
  this._eventBus.on('zone.created', this._createOutline, this);
};