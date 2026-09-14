'use strict';

var getLocalName = require('../../utils/LocalName'),
    _toNumber = require('lodash/lang').toNumber;

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
  return element.select('.innerElement').node().getBBox();
};

Outline.prototype._createOutline = function (element, definition) {
  // add the outline to every node created
  var type = getLocalName(definition),
      elemSize = {},
      x = 0,
      y = 0;
  if (type === 'link') {
    elemSize['width'] = 0;
    elemSize['height'] = 0;

    var wLen = definition.waypoint.length;
    if (wLen > 0) {
      var p1 = definition.waypoint[0],
          p2 = definition.waypoint[wLen - 1];
      x = Math.min(p1.x, p2.x);
      y = Math.min(p1.y, p2.y);
      elemSize['width'] = Math.abs(p2.x - p1.x);
      elemSize['height'] = Math.abs(p2.y - p1.y);
    }
  } else if (type === 'node') {
    elemSize['width'] = _toNumber(definition.size);
    elemSize['height'] = _toNumber(definition.size);
  } else {
    elemSize = this._getElemBBox(element);
  }
  var outline = element
    .insert('rect', ':first-child')
    .attr('class', 'element-outline')
    .attr('x', x)
    .attr('y', y)
    .attr('fill', 'none')
    .attr('stroke', 'red')
    .attr('stroke-width', 0)
    .attr('stroke-dasharray', '3')
    .attr('width', elemSize.width + 6)
    .attr('height', elemSize.height + 6);
  this._eventBus.emit('outline.created', element, definition, outline);
};

Outline.prototype._updateOutline = function (element, definition) {
  // update the outline to every node created
  var type = getLocalName(definition),
      elemSize = {},
      x = 0,
      y = 0;
  if (type === 'link') {
    elemSize['width'] = 0;
    elemSize['height'] = 0;

    var wLen = definition.waypoint.length;
    if (wLen > 0) {
      var p1 = definition.waypoint[0],
          p2 = definition.waypoint[wLen - 1];
      x = Math.min(p1.x, p2.x);
      y = Math.min(p1.y, p2.y);
      elemSize['width'] = Math.abs(p2.x - p1.x);
      elemSize['height'] = Math.abs(p2.y - p1.y);
    }
  } else if (type === 'node') {
    elemSize['width'] = _toNumber(definition.size);// - 11;
    elemSize['height'] = _toNumber(definition.size);// - 11;
  } else {
    elemSize = this._getElemBBox(element);
  }
  var outline = element
    .select('.element-outline')
    .attr('x', x)
    .attr('y', y)
    .attr('fill', 'none')
    .attr('stroke', 'red')
    .attr('stroke-width', 0)
    .attr('stroke-dasharray', '3')
    .attr('width', elemSize.width + 6)
    .attr('height', elemSize.height + 6);
  this._eventBus.emit('outline.updated', element, definition, outline);
};

Outline.prototype._init = function () {
  this._eventBus.on('node.created', this._createOutline, this);
  this._eventBus.on('label.created', this._createOutline, this);
  this._eventBus.on('zone.created', this._createOutline, this);
  this._eventBus.on('link.created', this._createOutline, this);

  this._eventBus.on('node.updated', this._updateOutline, this);
  this._eventBus.on('label.updated', this._updateOutline, this);
  this._eventBus.on('zone.updated', this._updateOutline, this);
  this._eventBus.on('link.updated', this._updateOutline, this);
};