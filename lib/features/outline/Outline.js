'use strict';

var d3 = require('d3'),
    forEach = require('lodash/collection').forEach,
    getLocalName = require('../../utils/LocalName');

require('./style.scss');

/**
 * Outline description
 *
 * @class
 * @constructor
 *
 * @param {Canvas} canvas
 * @param eventBus
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

Outline.prototype._getElemBBox = function (element) {
  return element.node().getBBox();
};

Outline.prototype._createOutline = function (element, definition) {
  // add the outline to every node created
  var that = this,
      type = getLocalName(definition),
      elemSize = this._getElemBBox(element);
  if (type === 'link'){
    var x = Infinity,
        y = Infinity;
    forEach(definition.waypoint, function(v){
      x = Math.min(x, v.x);
      y = Math.min(y, v.y);
    });
  }
  var outline = element
      .append('rect')
      .attr('class', 'element-outline')
      .attr('x', function () {
        var rt = 0;
        if (type === 'label') {
          rt = elemSize.width / -2.0;
        } else if (type === 'link') {
          rt = x;
        }
        return rt;
      })
      .attr('y', function () {
        var rt = 0;
        if (type === 'label') {
          rt = elemSize.height / -1.33333333;
        } else if (type === 'link') {
          rt = y;
        }
        return rt;
      })
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 0)
      .attr('stroke-dasharray', '3')
      .attr('width', elemSize.width + 6)
      .attr('height', elemSize.height + 6);
  that._eventBus.emit('outline.created', element, definition, outline);
};

Outline.prototype._updateOutline = function (element, definition) {
  // add the outline to every node created
  var that = this,
      type = getLocalName(definition),
      elemSize = this._getElemBBox(element);
  if (type === 'link'){
    var x = 0,
        y = 0;
    elemSize = {
      'width': 0,
      'height': 0
    };
    var wLen = definition.waypoint.length;
    if (wLen > 0) {
      var p1 = definition.waypoint[0],
          p2 = definition.waypoint[wLen-1];
      x = Math.min(p1.x, p2.x);
      y = Math.min(p1.y, p2.y);
      elemSize = {
        'width': Math.abs(p2.x - p1.x),
        'height': Math.abs(p2.y - p1.y)
      };
    }
  }
  var outline = element
      .select('.element-outline')
      .attr('x', function () {
        var rt = 0;
        if (type === 'label') {
          rt = elemSize.width / -2.0;
        } else if (type === 'link') {
          rt = x;
        }
        return rt;
      })
      .attr('y', function () {
        var rt = 0;
        if (type === 'label') {
          rt = elemSize.height / -1.33333333;
        } else if (type === 'link') {
          rt = y;
        }
        return rt;
      })
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', 0)
      .attr('stroke-dasharray', '3')
      .attr('width', elemSize.width + 6)
      .attr('height', elemSize.height + 6);
  that._eventBus.emit('outline.updated', element, definition, outline);
};

Outline.prototype._init = function () {
  var that = this;
  this._eventBus.on('node.created', function () {
    that._createOutline.apply(that, arguments);
  });
  this._eventBus.on('label.created', function () {
    that._createOutline.apply(that, arguments);
  });
  this._eventBus.on('zone.created', function () {
    that._createOutline.apply(that, arguments);
  });
  this._eventBus.on('link.created', function () {
    that._createOutline.apply(that, arguments);
  });
  this._eventBus.on('node.updated', function () {
    that._updateOutline.apply(that, arguments);
  });
  this._eventBus.on('label.updated', function () {
    that._updateOutline.apply(that, arguments);
  });
  this._eventBus.on('zone.updated', function () {
    that._updateOutline.apply(that, arguments);
  });
  this._eventBus.on('link.updated', function () {
    that._updateOutline.apply(that, arguments);
  });
};